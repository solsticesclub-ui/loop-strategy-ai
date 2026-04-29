
# Reads the raw HTML (double-encoded UTF-8) and writes a clean version
import sys

input_path = sys.argv[1] if len(sys.argv) > 1 else "superhuman-profil-raw.html"
output_path = sys.argv[2] if len(sys.argv) > 2 else "superhuman-profil.html"

with open(input_path, "r", encoding="utf-8") as f:
    content = f.read()

# Reverse double-encoding: encode back to latin-1 bytes, decode as utf-8
fixed = content.encode("latin-1", errors="replace").decode("utf-8", errors="replace")

with open(output_path, "w", encoding="utf-8") as f:
    f.write(fixed)

print(f"Done → {output_path}")
