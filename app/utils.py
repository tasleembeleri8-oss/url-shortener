ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(num: int) -> str:
    if num == 0:
        return ALPHABET[0]
    result = []
    while num > 0:
        num, rem = divmod(num, 62)
        result.append(ALPHABET[rem])
    return "".join(reversed(result))