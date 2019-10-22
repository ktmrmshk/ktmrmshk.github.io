import random, string

def randomname(n):
    return ''.join(random.choices(string.ascii_letters+string.digits, k=n))

print(randomname(1024))
