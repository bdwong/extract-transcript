Format of json file:

```json
[ // the object is an array of one array.
  [ // ??
    [ // paragraph?
      [ // a sentence?
        [ // a word
          "originalword",
          "transcribed-word-with-punctuation", // can be null if originalword is okay
          "start_ms",
          "end_ms",
          null,
          null,
          [
            1, // Don't know
            1  // Don't know
          ]
        ]
      ]
    ]
  ]
]
```