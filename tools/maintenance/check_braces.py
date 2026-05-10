import os

folder = r'c:\Users\kkagiri\Sources\Repo\Tenacy.FMS\fms.frontend\src\styles\dark'
files = sorted([f for f in os.listdir(folder) if f.endswith('.scss')])

print(f"{'File':<40} {'Open':>5} {'Close':>5} {'Diff':>5} {'Status'}")
print("-" * 70)

mismatched = []
for f in files:
    path = os.path.join(folder, f)
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    o = content.count('{')
    c = content.count('}')
    d = o - c
    status = "OK" if o == c else "MISMATCH"
    print(f"{f:<40} {o:>5} {c:>5} {d:>5} {status}")
    if o != c:
        mismatched.append((f, o, c, d))

print()
if mismatched:
    print(f"MISMATCHED FILES ({len(mismatched)}):")
    for f, o, c, d in mismatched:
        print(f"  {f}: {o} open, {c} close, diff={d}")
else:
    print("All files have balanced braces.")
