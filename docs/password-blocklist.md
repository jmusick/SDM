# Password blocklist provenance

`src/lib/data/common-passwords.json` contains the 70 NFC-normalized, case-folded values
of at least 15 Unicode code points from SecLists' `xato-net-10-million-passwords-100000.txt`
at commit `c205c36a445bff37f8e58a9ec829105cd4975c58`, retrieved 2026-10-04.
Shorter values are already rejected by the minimum-length policy. The policy also screens
three complete Stone Dragon Media name variants. Matching covers the complete prospective
password, not substrings. This is a bounded common/compromised-password snapshot, not a
complete or continuously updated breach database. Updates should refresh the pinned source,
review the resulting data, and retain this notice; there is no runtime network lookup.

[Source](https://github.com/danielmiessler/SecLists/blob/c205c36a445bff37f8e58a9ec829105cd4975c58/Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt)

The following license applies only to the imported list. SDM's site code remains subject to
its own `LICENSE.md`.

MIT License

Copyright (c) 2018 Daniel Miessler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
