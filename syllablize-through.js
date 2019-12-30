var through2 = require('through2');
var typesofphonemes = require('phoneme-types');

function createStream() {
  var syllablizeThroughStream = through2({
      objectMode: true
    },
    function syllablize(phonemeGroup, enc, callback) {

      this.push(syllablizePhonemeGroup(phonemeGroup));
      callback();
    }
  );

  return syllablizeThroughStream;
}

// Phoneme groups will look like this:
// {
//   "word": "ABALONE",
//   "phonemes": [
//     {"phoneme":"AE","stress":2},
//     {"phoneme":"B","stress":-1},
//     {"phoneme":"AH","stress":0},
//     {"phoneme":"L","stress":-1},
//     {"phoneme":"OW","stress":1},
//     {"phoneme":"N","stress":-1},
//     {"phoneme":"IY","stress":0}
//   ]
// }

function syllablizePhonemeGroup(phonemeGroup) {
  // console.log("phonemeGroup: ", phonemeGroup);
  var syllables = [];
  var currentSyllable = [];
  var currentSyllableHasAVowel = false;
  var phonemes = phonemeGroup.phonemes;

  for (var i = 0; i < phonemes.length; ++i) {
    var prePhonemeInfo = null;
    var phonemeInfo = phonemes[i];
    var nextPhonemeInfo = null;
    if (i > 0) {
      prePhonemeInfo = phonemes[i - 1];
    }
    if (i + 1 < phonemes.length) {
      nextPhonemeInfo = phonemes[i + 1];
    }

    if (shouldBreakToNextSyllable(prePhonemeInfo, phonemeInfo, nextPhonemeInfo, currentSyllableHasAVowel)) {

      // fix "T R" "D R" split into two syllables
      if (currentSyllable.length > 0 && (prePhonemeInfo.phoneme == 'T' || prePhonemeInfo.phoneme == 'D') && phonemeInfo.phoneme == 'R') {
        currentSyllable.pop();
        syllables.push(currentSyllable);
        currentSyllable = [prePhonemeInfo.phoneme, phonemeInfo.phoneme];
      }
      else {
        syllables.push(currentSyllable);
        currentSyllable = [phonemeInfo.phoneme];
      }

      currentSyllableHasAVowel = typesofphonemes.isVowelish(phonemeInfo.phoneme);
    }
    else {
      currentSyllable.push(phonemeInfo.phoneme);
      if (!currentSyllableHasAVowel) {
        currentSyllableHasAVowel = typesofphonemes.isVowelish(phonemeInfo.phoneme);
      }
    }
  }

  if (currentSyllable.length > 0) {
    if (currentSyllableHasAVowel) {
      syllables.push(currentSyllable);
    }
    // extend rest phonemes without vowel to last syllables
    else {
      syllables[syllables.length-1].push(...currentSyllable);
    }
  }
  // console.log("syllables: ", syllables);

  phonemeGroup.syllables = syllables;

  return phonemeGroup;
}

function shouldBreakToNextSyllable(prePhoneme, currentPhoneme, nextPhoneme, currentSyllableHasAVowel) {
  // console.log("prePhoneme: ", prePhoneme, "currentPhoneme: ", currentPhoneme, "nextPhoneme: ", nextPhoneme, "currentSyllableHasAVowel: ", currentSyllableHasAVowel);

  if (!currentSyllableHasAVowel) {
    return false;
  }
  else if (currentPhoneme.stress > -1) {
    return true;
  }
  else if (nextPhoneme && nextPhoneme.stress > -1) {
    return true;
  }
  // seperate 'B' and 'S' to two syllables
  else if (prePhoneme.phoneme == 'B' && currentPhoneme.phoneme == 'S') {
    return true;
  }
  else {
    return false;
  }
}

module.exports = {createStream: createStream};
