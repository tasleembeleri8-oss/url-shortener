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

    # Browser detection
    if "edg/" in ua:
        browser = "Edge"
    elif "opr/" in ua or "opera" in ua:
        browser = "Opera"
    elif "firefox/" in ua or "fxios" in ua:
        browser = "Firefox"
    elif "chrome/" in ua or "crios" in ua:
        browser = "Chrome"
    elif "safari/" in ua:
        browser = "Safari"
    else:
        browser = "Other"

    # Device detection
    if any(term in ua for term in ("bot", "crawler", "spider", "curl/")):
        device = "bot"
    elif "ipad" in ua or "tablet" in ua:
        device = "tablet"
    elif any(term in ua for term in ("mobile", "android", "iphone", "ipod")):
        device = "mobile"
    else:
        device = "desktop"

    # Operating system detection
    if "windows" in ua:
        operating_system = "Windows"
    elif "iphone" in ua or "ipad" in ua or "ipod" in ua:
        operating_system = "iOS"
    elif "android" in ua:
        operating_system = "Android"
    elif "mac os" in ua or "macintosh" in ua:
        operating_system = "macOS"
    elif "linux" in ua:
        operating_system = "Linux"
    elif "cros" in ua:
        operating_system = "ChromeOS"
    else:
        operating_system = "Other"

    return browser, device, operating_system
