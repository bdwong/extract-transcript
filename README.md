# extract-transcript

Extract a transcript from Google Recorder json file with periodic timestamps.

## Saving a Google Recorder json file

The recording uploaded to Google Recorder contains all the information we need to make text transcripts or subtitles of the recording.

- Go to https://recorder.google.com.
- Open up your browser developer tools (F12 on most) and select the network tab.
- Click on the recording to capture.
- In the request filter (magnifying glass), type GetTranscription.
- Click the Response tab to see the JSON.
- Continue below based on your browser.

**Chrome, Edge**

- Copy-paste the JSON into a text file and save it.

**Firefox**

- Enable the raw switch. Double-click to highlight, then copy the Base64 text.
- in the console, type `atob(` (it should autocomplete)
- Paste and hit Enter.
- Click the arrow to expand the result. Right-click to copy object and paste the JSON into a text file and save it.

## Using extract-transcript

Run `extract-transcript -h` to get help.

```
Usage: extract-transcript [options]

Options:
  -i, --interval <seconds>        print timestamp after specific interval (in seconds)
  -s, --softbreak <numchars>      break block on first trailing punctuation after numchars characters
  -j, --join-hyphens              join words with trailing hyphens
  -b, --break-hyphens             break apart words with inline hyphens
  -r, --replace-words <jsonFile>  search and replace using words from JSON file
  -f, --format <type>             output format (choices: "txt", "transcript", "srt", "vtt", default: "transcript")
  -h, --help                      display help for command
```

### Example

Here's a script that converts the JSON transcript into WebVTT format. The caption block soft breaks after 74 characters.

```sh
mkdir -p webvtt
for i in *.json; do
  extract-transcript -s 74 -f vtt "$i" > webvtt/"${i/%.json/}.vtt"
done
```

### Replace words

Create a file in JSON format containing a list of word pairs. The first is the word to search for, the second is the replacement word.

```json
[
  ["i'll", "I'll"],
  ["i've", "I've"],
  ["i'm", "I'm"],
  ["i", "I"]
]
```

Then run `extract-transcript` with the `-r` option. If the file is called replace.json:

```sh
extract-transcript -r replace.json -f vtt "transcript.json" > transcript.vtt"

```