"""
Helpers for editing case files without reformatting them.

Pretty-printed files (json.dumps indent=2) are rewritten in the same style. Hand-formatted
files keep one graph node per line, so only the changed node's line is replaced and the
rest of the file stays byte for byte as it was.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "public" / "locales"


class CaseFile:
    def __init__(self, lang, case):
        self.path = ROOT / lang / f"{case}.json"
        self.text = self.path.read_text()
        self.data = json.loads(self.text)
        stripped = self.text.rstrip("\n")
        self.pretty_ascii = stripped == json.dumps(self.data, indent=2)
        self.pretty_utf8 = stripped == json.dumps(self.data, indent=2, ensure_ascii=False)
        self.pretty = self.pretty_ascii or self.pretty_utf8
        self.changed_nodes = set()
        self.changed_top = set()

    def node(self, nid):
        for n in self.data["managementGraph"]["nodes"]:
            if n["id"] == nid:
                self.changed_nodes.add(nid)
                return n
        raise KeyError(f"{self.path.name}: no node {nid}")

    def set_top(self, key, value):
        self.data[key] = value
        self.changed_top.add(key)

    def save(self):
        if self.pretty:
            out = json.dumps(self.data, indent=2, ensure_ascii=self.pretty_ascii)
            if self.text.endswith("\n"):
                out += "\n"
        else:
            lines = self.text.split("\n")
            nodes = {n["id"]: n for n in self.data["managementGraph"]["nodes"]}
            for nid in self.changed_nodes:
                idx = [i for i, ln in enumerate(lines) if f'"id": "{nid}"' in ln and '"type"' in ln]
                assert len(idx) == 1, f"{self.path.name}: node {nid} is not on a single line"
                i = idx[0]
                indent = lines[i][: len(lines[i]) - len(lines[i].lstrip())]
                comma = "," if lines[i].rstrip().endswith(",") else ""
                lines[i] = indent + json.dumps(nodes[nid], ensure_ascii=False) + comma
            for key in self.changed_top:
                idx = [i for i, ln in enumerate(lines) if ln.startswith(f'  "{key}":')]
                assert len(idx) == 1, f"{self.path.name}: top-level {key} not found on one line"
                i = idx[0]
                comma = "," if lines[i].rstrip().endswith(",") else ""
                lines[i] = f'  "{key}": ' + json.dumps(self.data[key], ensure_ascii=False) + comma
            out = "\n".join(lines)
        assert json.loads(out) == self.data, f"{self.path.name}: round trip changed the data"
        self.path.write_text(out)


def edit(lang, case):
    return CaseFile(lang, case)
