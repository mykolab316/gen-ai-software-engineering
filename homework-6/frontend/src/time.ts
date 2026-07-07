import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

/** Readable local timestamp, e.g. "Jul 7, 2026 9:03 PM". */
export function formatRunTime(iso: string): string {
  const d = dayjs.utc(iso).local();
  if (!d.isValid()) return iso;
  return d.format("MMM D, YYYY h:mm A");
}

/** Relative time from now, e.g. "3 minutes ago". */
export function fromNow(iso: string): string {
  const d = dayjs.utc(iso).local();
  return d.isValid() ? d.fromNow() : "";
}
