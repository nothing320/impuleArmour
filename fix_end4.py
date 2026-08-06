with open("src/pages/Terminal.tsx", "r") as f:
    text = f.read()

idx = text.find("Connect Wallet to Trade")
if idx != -1:
    text = text[:idx] + """Connect Wallet to Trade
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"""
    with open("src/pages/Terminal.tsx", "w") as f:
        f.write(text)
    print("Fixed!")
else:
    print("Not found")
