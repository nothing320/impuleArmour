with open("src/pages/Terminal.tsx", "r") as f:
    text = f.read()

import re
# Find from `Connect Wallet to Trade` to the end
pattern = re.compile(r"Connect Wallet to Trade\s*</button>\s*)}\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\);\s*}", re.MULTILINE)
replacement = """Connect Wallet to Trade
                  </button>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}"""

if pattern.search(text):
    text = pattern.sub(replacement, text)
    with open("src/pages/Terminal.tsx", "w") as f:
        f.write(text)
    print("Fixed!")
else:
    print("Not found")
