long_string='/* '
with open('long_string.txt', 'r') as f:
    long_string+=f.read()
long_string+=' */'

code='''var obj = JSON.parse('{ "name":"FILENAME", "fileid":"ktmr", "city":"New York"}');console.log(obj);'''

for i in range(20):
    filename='{:04d}.js'.format(i)
    code_edited = code.replace('FILENAME', filename)
    with open(filename, 'w') as f:
        f.write(long_string)
        f.write(code_edited)
