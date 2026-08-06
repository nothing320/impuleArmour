with open("src/pages/Terminal.tsx", "r") as f:
    text = f.read()

text = text.replace("""                  </button>
                )}
              </div>
           </div>
         </div>
      </div>
    </div>
  );
}""", """                  </button>
                )}
              </div>
           </div>
         </div>
        )}
      </div>
    </div>
  );
}""")

with open("src/pages/Terminal.tsx", "w") as f:
    f.write(text)
