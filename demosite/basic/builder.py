def CSS(url):
    print('<link rel="stylesheet" type="text/css" href="{}">'.format(url))

def SCRIPT(url, is_async=False, attr={}):
    attr_list=[]
    for k,v in attr.items():
        attr_list.append('{}="{}"'.format(k,v))
    else:
        if is_async:
            attr_list.append('async')
    print('<script {} src="{}"></script>'.format(' '.join(attr_list), url))

def H1(string):
    print('<h1>{}</h1>'.format(string))

def IMG(url, attr={}):
    '''
    attr: [{'alt': 'sample', 'width': 500}]
    '''
    attr_list=[]
    attr_str=str()
    for k,v in attr.items():
        attr_list.append('{}="{}"'.format(k,v))
    else:
        attr_str=' '.join(attr_list)
    print('<img src="{}" {} >'.format(url, attr_str))

def do_export():
    print('<!DOCTYPE html>')
    print('<html>')
    print('<head>')
    print('<meta charset="UTF-8">')
    print('<title>Title of the document</title>')
    
    for i in range(20):
        cssfile='css/{:04d}.css'.format(i)
        CSS(cssfile)
    
    print('</head>')

    ### Body ###
    print('<body>')
    
    H1('This is test HTML')
    
    for i in range(200):
        imgfile='img/{:04d}_low.jpg'.format(i)
        IMG(imgfile, {'width': 200})

    for i in range(20):
        SCRIPT('js/{:04d}.js'.format(i), is_async=True)


    print('</body>')
    print('</html>')

if __name__ == '__main__':
    do_export()



