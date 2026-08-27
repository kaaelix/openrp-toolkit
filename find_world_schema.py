import urllib.request
import re

content = urllib.request.urlopen('https://openrp.ai/docs/llms-full.txt').read().decode('utf-8')
for m in re.finditer(r'### `(World|Character|Prompt)[^`]*`', content):
    pos = m.start()
    print(content[pos:pos+800])
    print('=' * 60)
