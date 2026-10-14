ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(num: int) -> str:
    if num == 0:
        return ALPHABET[0]
    result = []
    while num > 0:
        num, rem = divmod(num, 62)
        result.append(ALPHABET[rem])
    return "".join(reversed(result))

def parse_user_agent(ua: str | None):
    ua = (ua or "").lower()
    if "edg/" in ua:
        browser = "Edge"
    elif "opr/" in ua or "opera" in ua:
        browser = "Opera"
    elif "chrome" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    else:
        browser = "Other"

    if "bot" in ua or "curl" in ua or "spider" in ua:
        device = "bot"
    elif "ipad" in ua or "tablet" in ua:
        device = "tablet"
    elif "mobile" in ua or "android" in ua or "iphone" in ua:
        device = "mobile"
    else:
        device = "desktop"
    return browser, device