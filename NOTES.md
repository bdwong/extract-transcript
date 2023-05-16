# File formats

## Google Recorder
Expected Format of JSON input file:

```json
[ // Tuple with one element (Array)
  [ // Array of speech blocks
    [ // Speech block
      [ // Word collection
        [ // a word
          "transcribed-word", // lowercase word, both leading and trailing spaces and punctuation are trimmed.
          "decorated-word", // with punctuation, spaces and capitalization. null if original word would be the same.
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

## SRT

From Wikipedia: [SubRip file format (SRT)](https://en.wikipedia.org/wiki/SubRip)

```
1
00:02:16,612 --> 00:02:19,376
Senator, we're making
our final approach into Coruscant.

```

Repeat for each subtitle:

- 1-based counter
- HH:MM:SS,tt --> HH:MM:SS,mm
- One or more lines with subtitle text
- [a blank line ends the subtitle.]

## WebVTT

From Wikipedia: [Web Video Text Tracks (WebVTT)](https://en.wikipedia.org/wiki/WebVTT)
