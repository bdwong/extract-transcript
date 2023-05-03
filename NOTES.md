Format of json file:

```json
[ // Tuple with one element (Array)
  [ // Array of speech blocks
    [ // Speech block
      [ // Word collection
        [ // a word
          "transcribed-word", // lowercase word
          "decorated-word", // with punctuation and capitalization. null if original word has no punctuation/capitalization.
          "start_ms", // start of word in ms
          "end_ms", // end of word in ms
          null,
          null,
          [
            1, // New speaker (0=same speaker, 1=change speaker. Note: the very first word may be 0, i.e. speaker not determined, in which case the next speech block may start with 1.)
            1  // Speaker number (0=no speaker detection(?), 1=first speaker, 2=second speaker...)
          ]
        ]
      ],
      0, // ??
      "en-us"
    ]
  ]
]
```