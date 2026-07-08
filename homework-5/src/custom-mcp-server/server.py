import os
from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("lorem-mcp")

def _first_words(word_count: int = 30) -> str:
    """Read lorem-ipsum.md and return exactly word_count words."""
    lorem_path = Path(__file__).parent / "lorem-ipsum.md"
    with open(lorem_path, "r") as f:
        text = f.read()
    words = text.split()
    return " ".join(words[:word_count])

@mcp.tool
def read(word_count: int = 30) -> str:
    """Read the first word_count words from lorem-ipsum.md.

    Args:
        word_count: Number of words to return (default: 30)

    Returns:
        Exactly word_count words from the lorem-ipsum text
    """
    return _first_words(word_count)

@mcp.resource("lorem://words/{word_count}")
def get_lorem_words(word_count: str) -> str:
    """Resource that returns the first word_count words from lorem-ipsum.md.

    Args:
        word_count: Number of words to return (as a string from the URI)

    Returns:
        Exactly word_count words from the lorem-ipsum text
    """
    return _first_words(int(word_count))

if __name__ == "__main__":
    mcp.run()
