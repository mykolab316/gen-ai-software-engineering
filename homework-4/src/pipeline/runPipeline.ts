/**
 * Single-command 4-agent pipeline orchestrator (live Anthropic SDK).
 *
 *   npm run pipeline
 *
 * For each agent, in order, this:
 *   1. parses `<agent>.agent.md` (frontmatter `model` + body = system prompt),
 *   2. auto-injects the referenced skill and reads the declared input files,
 *   3. calls the real Claude API with that agent's prescribed model,
 *   4. parses the `<<<FILE: path>>> ... <<<END>>>` blocks and writes the artifacts,
 *   5. runs tests where relevant and records the real result,
 *   6. prints a per-agent proof-of-execution log line.
 *
 * Step 0 restores `app/` from the pristine `context/bugs/001/before/app` snapshot and
 * clears `tests/generated/`, so every run starts from the same buggy state (idempotent).
 */
import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'); // = src/
const MAX_TOKENS = 8192;

// ---- tiny helpers -----------------------------------------------------------
const rd = (p: string) => readFileSync(join(ROOT, p), 'utf8');
function wr(p: string, content: string) {
  const abs = join(ROOT, p);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}
const tail = (s: string, n = 25) => s.trim().split('\n').slice(-n).join('\n');

function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function runCmd(cmd: string): { ok: boolean; out: string } {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out };
  } catch (e: any) {
    return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

function parseFileBlocks(text: string): { path: string; content: string }[] {
  const re = /<<<FILE:\s*(.+?)>>>\r?\n([\s\S]*?)\r?\n<<<END>>>/g;
  const blocks: { path: string; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) blocks.push({ path: m[1].trim(), content: m[2] });
  return blocks;
}

// ---- pipeline configuration -------------------------------------------------
const AGENT_FILES = [
  'agents/research-verifier.agent.md',
  'agents/bug-fixer.agent.md',
  'agents/security-verifier.agent.md',
  'agents/unit-test-generator.agent.md',
];

// What test command (if any) the pipeline runs AFTER a given agent, and where to
// record the real result.
const POST: Record<string, { cmd: string; recordInto: string; label: string }> = {
  'bug-fixer': {
    cmd: 'npm test',
    recordInto: 'context/bugs/001/fix-summary.md',
    label: 'Full test suite',
  },
  'unit-test-generator': {
    cmd: 'npx vitest run tests/generated',
    recordInto: 'context/bugs/001/test-report.md',
    label: 'Generated tests',
  },
};

interface AgentSpec {
  name: string;
  role: string;
  model: string;
  skill?: string;
  inputs: string[];
  outputs: string[];
  systemPrompt: string;
}

function loadAgent(file: string): AgentSpec {
  const { data, content } = matter(rd(file));
  return {
    name: data.name,
    role: data.role ?? data.name,
    model: data.model,
    skill: data.skill,
    inputs: data.inputs ?? [],
    outputs: data.outputs ?? [],
    systemPrompt: content.trim(),
  };
}

function buildUserPrompt(agent: AgentSpec): string {
  const parts: string[] = [];
  if (agent.skill && existsSync(join(ROOT, agent.skill))) {
    parts.push(`## SKILL (authoritative) — ${agent.skill}\n\n${rd(agent.skill)}`);
  }
  for (const input of agent.inputs) {
    if (input.includes('*') || !existsSync(join(ROOT, input))) continue; // skip globs / not-yet-existing
    parts.push(`## INPUT FILE — ${input}\n\n\`\`\`\n${rd(input)}\n\`\`\``);
  }
  parts.push('Follow your OUTPUT CONTRACT exactly. Output ONLY the file block(s).');
  return parts.join('\n\n');
}

// ---- main -------------------------------------------------------------------
async function main() {
  loadEnv();
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('════════════════════════════════════════════════════════════════');
  console.log(' 4-Agent Pipeline — Bug 001 (Team Dashboard)');
  console.log(` started ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════════════════');

  // Step 0 — restore pristine buggy state (idempotency).
  rmSync(join(ROOT, 'app'), { recursive: true, force: true });
  cpSync(join(ROOT, 'context/bugs/001/before/app'), join(ROOT, 'app'), { recursive: true });
  rmSync(join(ROOT, 'tests/generated'), { recursive: true, force: true });
  console.log('[0/4] restore            src/app <- before/app snapshot; cleared tests/generated   OK\n');

  const total = AGENT_FILES.length;
  for (let i = 0; i < total; i++) {
    const agent = loadAgent(AGENT_FILES[i]);
    const step = `[${i + 1}/${total}]`;
    const logIn = agent.inputs[0] ?? '-';
    const logOut = agent.outputs.find((o) => o.endsWith('.md')) ?? agent.outputs[0] ?? '-';

    const resp = await client.messages.create({
      model: agent.model,
      max_tokens: MAX_TOKENS,
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: buildUserPrompt(agent) }],
    });
    const text = resp.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');

    const blocks = parseFileBlocks(text);
    if (blocks.length === 0) {
      console.log(`${step} ${agent.name.padEnd(20)} model=${agent.model}   FAIL (no file blocks returned)`);
      console.error(text.slice(0, 500));
      process.exit(1);
    }
    for (const b of blocks) wr(b.path, b.content.endsWith('\n') ? b.content : `${b.content}\n`);

    // Optional post-step: run tests and record the real result.
    let status = 'PASS';
    const post = POST[agent.name];
    if (post) {
      const res = runCmd(post.cmd);
      status = res.ok ? 'PASS' : 'FAIL';
      const section = `\n\n## ${post.label} (recorded by pipeline)\n\nCommand: \`${post.cmd}\`\n\n\`\`\`\n${tail(res.out)}\n\`\`\`\n\nResult: ${status}\n`;
      wr(post.recordInto, rd(post.recordInto) + section);
    }

    console.log(
      `${step} ${agent.name.padEnd(20)} model=${agent.model.padEnd(20)} in=${logIn.padEnd(42)} out=${logOut.padEnd(46)} ${status}`,
    );
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(' Pipeline complete. Artifacts written under context/bugs/001/.');
  console.log('════════════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Pipeline error:', err?.message ?? err);
  process.exit(1);
});
