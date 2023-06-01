import { toUint8Array } from '@typhonjs-svelte/runtime-base/data/format/base64';
import { inflateSync } from '@typhonjs-svelte/runtime-base/data/compress';

/**
 * Shared constants between {@link UnicodeTrie} and {@link UnicodeTrieBuilder}.
 */
class Const {
    static SHIFT_1 = 6 + 5;
    /**
     * Shift size for getting the index-2 table offset.
     */
    static SHIFT_2 = 5;
    /**
     * Difference between the two shift sizes, for getting an index-1 offset from an index-2 offset. `6=11-5`.
     */
    static SHIFT_1_2 = this.SHIFT_1 - this.SHIFT_2;
    /**
     * Number of index-1 entries for the BMP. `32=0x20`.
     * This part of the index-1 table is omitted from the serialized form.
     */
    static OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> this.SHIFT_1;
    /**
     * Number of entries in an index-2 block. `64=0x40`.
     */
    static INDEX_2_BLOCK_LENGTH = 1 << this.SHIFT_1_2;
    /**
     * Mask for getting the lower bits for the in-index-2-block offset.
     */
    static INDEX_2_MASK = this.INDEX_2_BLOCK_LENGTH - 1;
    /**
     * Shift size for shifting left the index array values.
     * Increases possible data size with 16-bit index values at the cost of "compactability".
     * This requires data blocks to be aligned by #DATA_GRANULARITY.
     */
    static INDEX_SHIFT = 2;
    /**
     * Number of entries in a data block. `32=0x20`.
     */
    static DATA_BLOCK_LENGTH = 1 << this.SHIFT_2;
    /**
     * Mask for getting the lower bits for the in-data-block offset.
     */
    static DATA_MASK = this.DATA_BLOCK_LENGTH - 1;
    /**
     * The part of the index-2 table for U+D800..U+DBFF stores values for lead surrogate code _units_ not code _points_.
     * Values for lead surrogate code _points_ are indexed with this portion of the table.
     * Length=32=0x20=0x400>>SHIFT_2. (There are 1024=0x400 lead surrogates.)
     */
    static LSCP_INDEX_2_OFFSET = 0x10000 >> this.SHIFT_2;
    static LSCP_INDEX_2_LENGTH = 0x400 >> this.SHIFT_2;
    /**
     * Count the lengths of both BMP pieces. `2080=0x820`.
     */
    static INDEX_2_BMP_LENGTH = this.LSCP_INDEX_2_OFFSET + this.LSCP_INDEX_2_LENGTH;
    /**
     * The 2-byte UTF-8 version of the index-2 table follows at offset `2080=0x820`.
     * Length `32=0x20` for lead bytes `C0..DF`, regardless of SHIFT_2.
     */
    static UTF8_2B_INDEX_2_OFFSET = this.INDEX_2_BMP_LENGTH;
    static UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; // U+0800 is the first code point after 2-byte UTF-8
    /**
     * The index-1 table, only used for supplementary code points, at offset `2112=0x840`.
     * Variable length, for code points up to highStart, where the last single-value range starts.
     * Maximum length 512=0x200=0x100000>>SHIFT_1.
     * (For 0x100000 supplementary code points U+10000..U+10ffff.)
     *
     * The part of the index-2 table for supplementary code points starts after this index-1 table.
     *
     * Both the index-1 table and the following part of the index-2 table are omitted completely if there is only BMP
     * data.
     */
    static INDEX_1_OFFSET = this.UTF8_2B_INDEX_2_OFFSET + this.UTF8_2B_INDEX_2_LENGTH;
    static MAX_INDEX_1_LENGTH = 0x100000 >> this.SHIFT_1;
    /**
     * The alignment size of a data block. Also, the granularity for compaction.
     */
    static DATA_GRANULARITY = 1 << this.INDEX_SHIFT;
}

/**
 * Provides a helper utility to potentially swap a typed array to little endian.
 */
class Swap32LE {
    /**
     * Swaps the given typed array as necessary to little endian as necessary. Uint8Array is assumed to have 32-bit data
     * internally.
     *
     * @param {Uint8Array | Uint32Array} array - Array to potentially swap.
     *
     * @returns {Uint8Array | Uint32Array} Passed in array.
     */
    static swap(array) {
        /* c8 ignore next */
        if (this.#isBigEndian) {
            this.#swap32(array);
        }
        return array;
    }
    static #isBigEndian = (new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12);
    /* c8 ignore next 6 */
    static #swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
    }
    /* c8 ignore next 10 */
    static #swap32(array) {
        const len = array.length;
        for (let i = 0; i < len; i += 4) {
            this.#swap(array, i, i + 3);
            this.#swap(array, i + 1, i + 2);
        }
    }
}

/**
 * Provides lookup in a pre-built UnicodeTrie data structure. Use {@link UnicodeTrieBuilder} for building /
 * serialization of a pre-built data structure.
 */
class UnicodeTrie {
    #data;
    #errorValue;
    #highStart;
    /**
     * @param {UnicodeTrieParsedData | UnicodeTrieRawData} data -
     */
    constructor(data) {
        if (data instanceof Uint8Array) {
            // Is Node Buffer read binary format.
            if (typeof data.readUInt32LE === 'function') {
                this.#highStart = data.readUInt32LE(0);
                this.#errorValue = data.readUInt32LE(4);
                data = data.slice(12);
            }
            else {
                const view = new DataView(data.buffer);
                this.#highStart = view.getUint32(0, true);
                this.#errorValue = view.getUint32(4, true);
                data = data.subarray(12);
            }
            // Double inflate the actual trie data.
            data = inflateSync(data);
            // Swap bytes from little-endian.
            Swap32LE.swap(data);
            this.#data = new Uint32Array(data.buffer);
        }
        else {
            // pre-parsed data
            ({ data: this.#data, highStart: this.#highStart, errorValue: this.#errorValue } = data);
        }
    }
    /**
     * @returns {Uint32Array} The data array.
     */
    get data() { return this.#data; }
    /**
     * @returns {number} The error value.
     */
    get errorValue() { return this.#errorValue; }
    /**
     * @returns {number} The high start.
     */
    get highStart() { return this.#highStart; }
    /**
     * @param {number}   codePoint -
     */
    get(codePoint) {
        if ((codePoint < 0) || (codePoint > 0x10ffff)) {
            return this.#errorValue;
        }
        let index;
        if ((codePoint < 0xd800) || ((codePoint > 0xdbff) && (codePoint <= 0xffff))) {
            // Ordinary BMP code point, excluding leading surrogates.
            // BMP uses a single level lookup.  BMP index starts at offset 0 in the index.
            // data is stored in the index array itself.
            index = (this.#data[codePoint >> Const.SHIFT_2] << Const.INDEX_SHIFT) + (codePoint & Const.DATA_MASK);
            return this.#data[index];
        }
        if (codePoint <= 0xffff) {
            // Lead Surrogate Code Point.  A Separate index section is stored for
            // lead surrogate code units and code points.
            //   The main index has the code unit data.
            //   For this function, we need the code point data.
            index = (this.#data[Const.LSCP_INDEX_2_OFFSET +
                ((codePoint - 0xd800) >> Const.SHIFT_2)] << Const.INDEX_SHIFT) +
                (codePoint & Const.DATA_MASK);
            return this.#data[index];
        }
        if (codePoint < this.#highStart) {
            // Supplemental code point, use two-level lookup.
            index = this.#data[(Const.INDEX_1_OFFSET - Const.OMITTED_BMP_INDEX_1_LENGTH) + (codePoint >> Const.SHIFT_1)];
            index = this.#data[index + ((codePoint >> Const.SHIFT_2) & Const.INDEX_2_MASK)];
            index = (index << Const.INDEX_SHIFT) + (codePoint & Const.DATA_MASK);
            return this.#data[index];
        }
        return this.#data[this.#data.length - Const.DATA_GRANULARITY];
    }
}

/**
 * Defines useful constants from Unicode Annex #29 - Unicode Text Segmentation.
 *
 * @see https://www.unicode.org/reports/tr29
 */
var UAX29;
(function (UAX29) {
    (function (ClusterBreak) {
        ClusterBreak[ClusterBreak["Other"] = 0] = "Other";
        ClusterBreak[ClusterBreak["CR"] = 1] = "CR";
        ClusterBreak[ClusterBreak["LF"] = 2] = "LF";
        ClusterBreak[ClusterBreak["Control"] = 4] = "Control";
        ClusterBreak[ClusterBreak["Extend"] = 8] = "Extend";
        ClusterBreak[ClusterBreak["ZWJ"] = 16] = "ZWJ";
        ClusterBreak[ClusterBreak["Regional_Indicator"] = 32] = "Regional_Indicator";
        ClusterBreak[ClusterBreak["Prepend"] = 64] = "Prepend";
        ClusterBreak[ClusterBreak["SpacingMark"] = 128] = "SpacingMark";
        ClusterBreak[ClusterBreak["L"] = 256] = "L";
        ClusterBreak[ClusterBreak["V"] = 512] = "V";
        ClusterBreak[ClusterBreak["T"] = 1024] = "T";
        ClusterBreak[ClusterBreak["LV"] = 2048] = "LV";
        ClusterBreak[ClusterBreak["LVT"] = 4096] = "LVT";
        ClusterBreak[ClusterBreak["Extended_Pictographic"] = 8192] = "Extended_Pictographic";
    })(UAX29.ClusterBreak || (UAX29.ClusterBreak = {}));
})(UAX29 || (UAX29 = {}));

const UNICODE_GRAPHEME_B64_TYPE_TRIE = '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';

const UNICODE_GRAPHEME_B64_EXT_PICT_TRIE = 'AAACAAAAAACAOAAA7ZktSAVBEMefGtRiMVrEJlhsxgOLGESMBrkkKrwiCA+L2ASbxSQYjGK0aLLZbEbFaLTZ/C/eg+XYu7c7+/Xg/gM/dm8/ZmZndvfCrk32egXYANtgD+yDYXsXSkK6zBE4buk/1ern4MJB9yW40r6H9Wtw0zLvsKXvDtyDB/AInjReat+v4A28gw/wBb4d4/PjEdvfqpyYyp/nJvoBdU2P8ToJIYQQQgghhBBCCCGEEEJIfMrZfwbgcyY9RS8PJWzfAv2t0sQc3tPUW6mK1TzqC2AJqL5llKvqvQ0UVZsL65ZznsHmiLFbyg9Du57rnWqMYqXSt1u1lVV5gLKv2TpBfQDOBOur2zch0RkKFVcKpfOyaNmWQiR2U/ga00Zs3SYkOlKKrc2UfoWy1ZQTmzylyqHt2Fz3hElMsWuLq0sepHNiYSuh7UniNWqfSPua1uoi9bU19ducRemZlJ5pqbja8/Er19zQeyRGfmLpTBHHNtu+9kLG2/f+DJUryR0aes0p/jchJNV/0Vdcc2oalyufvrEcBx8kEtt+aP9D7nfJ/FT5ybVfUp8nSV/E8/QH';

/**
 * Provides internal support for lazy loading of Unicode trie data and essential lookups.
 */
class GraphemeSplitHelper {
    static #typeTrie;
    static #extPict;
    static #isLoaded = false;
    static GB11State = {
        Initial: 0,
        ExtendOrZWJ: 1,
        NotBoundary: 2,
    };
    static checkLoadData() {
        if (!this.#isLoaded) {
            this.#typeTrie = new UnicodeTrie(toUint8Array(UNICODE_GRAPHEME_B64_TYPE_TRIE));
            this.#extPict = new UnicodeTrie(toUint8Array(UNICODE_GRAPHEME_B64_EXT_PICT_TRIE));
            this.#isLoaded = true;
        }
    }
    /**
     * Returns the `OR` result of lookups from `typeTrie` and `extPict`.
     *
     * @param {number}   codePoint - A Unicode code point to lookup.
     *
     * @returns {number} Code point meta-data.
     */
    static get(codePoint) {
        return this.#typeTrie.get(codePoint) | this.#extPict.get(codePoint);
    }
    /**
     * Helper function to test stored code point types.
     *
     * @param {number}   type - Code point type.
     *
     * @param {number}   bit - ClusterBreak to test against.
     */
    static is(type, bit) {
        return (type & bit) !== 0;
    }
    /**
     * Analyzes the next grapheme cluster size from a pre-parsed string of code point types.
     *
     * @param {number[]}   ts - Code point types.
     *
     * @param {number}   start -
     */
    static nextGraphemeClusterSize(ts, start) {
        const CB = UAX29.ClusterBreak;
        const L = ts.length;
        let ri = 0;
        let gb11State = this.GB11State.Initial;
        // GB1: sot ÷ Any
        for (let i = start; i + 1 < L; i++) {
            const curr = ts[i];
            const next = ts[i + 1];
            // for GB12, GB13
            if (!this.is(curr, CB.Regional_Indicator)) {
                ri = 0;
            }
            // for GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
            switch (gb11State) {
                case this.GB11State.NotBoundary:
                case this.GB11State.Initial:
                    if (this.is(curr, CB.Extended_Pictographic)) {
                        gb11State = this.GB11State.ExtendOrZWJ;
                    }
                    else {
                        gb11State = this.GB11State.Initial;
                    }
                    break;
                case this.GB11State.ExtendOrZWJ:
                    if (this.is(curr, CB.Extend)) {
                        gb11State = this.GB11State.ExtendOrZWJ;
                    }
                    else if (this.is(curr, CB.ZWJ) && this.is(next, CB.Extended_Pictographic)) {
                        gb11State = this.GB11State.NotBoundary;
                    }
                    else {
                        gb11State = this.GB11State.Initial;
                    }
                    break;
            }
            // GB3: CR x LF
            if (this.is(curr, CB.CR) && this.is(next, CB.LF)) {
                continue;
            }
            // GB4: (Control | CR | LF) ÷
            if (this.is(curr, CB.Control | CB.CR | CB.LF)) {
                return i + 1 - start;
            }
            // GB5: ÷ (Control | CR | LF)
            if (this.is(next, CB.Control | CB.CR | CB.LF)) {
                return i + 1 - start;
            }
            // GB6: L x (L | V | LV | LVT)
            if (this.is(curr, CB.L) && this.is(next, CB.L | CB.V | CB.LV | CB.LVT)) {
                continue;
            }
            // GB7: (LV | V) x (V | T)
            if (this.is(curr, CB.LV | CB.V) && this.is(next, CB.V | CB.T)) {
                continue;
            }
            // GB8: (LVT | T) x T
            if (this.is(curr, CB.LVT | CB.T) && this.is(next, CB.T)) {
                continue;
            }
            // GB9: x (Extend | ZWJ)
            if (this.is(next, CB.Extend | CB.ZWJ)) {
                continue;
            }
            // GB9a: x SpacingMark
            if (this.is(next, CB.SpacingMark)) {
                continue;
            }
            // GB9b: Prepend x
            if (this.is(curr, CB.Prepend)) {
                continue;
            }
            // GB11: \p{Extended_Pictographic} Extend* ZWJ x \p{Extended_Pictographic}
            if (gb11State === this.GB11State.NotBoundary) {
                continue;
            }
            // GB12: sot (RI RI)* RI x RI
            // GB13: [^RI] (RI RI)* RI x RI
            if (this.is(curr, CB.Regional_Indicator) && this.is(next, CB.Regional_Indicator) && ri % 2 === 0) {
                ri++;
                continue;
            }
            // GB999: Any ÷ Any
            return i + 1 - start;
        }
        // GB2: Any ÷ eot
        return L - start;
    }
}
/**
 * Splits the given string into an array of Unicode grapheme clusters.
 *
 * @param {string}   str - String to split.
 *
 * @returns {string[]} The string split by Unicode grapheme clusters.
 */
function graphemeSplit(str) {
    GraphemeSplitHelper.checkLoadData();
    const graphemeClusters = [];
    const map = [0];
    const ts = [];
    for (let i = 0; i < str.length;) {
        const code = str.codePointAt(i);
        ts.push(GraphemeSplitHelper.get(code));
        i += code > 65535 ? 2 : 1;
        map.push(i);
    }
    for (let offset = 0; offset < ts.length;) {
        const size = GraphemeSplitHelper.nextGraphemeClusterSize(ts, offset);
        const start = map[offset];
        const end = map[offset + size];
        graphemeClusters.push(str.slice(start, end));
        offset += size;
    }
    return graphemeClusters;
}
/**
 * Provides an iterator for tokenizing a string by grapheme clusters.
 *
 * Note: This is a naive implementation that fully parses the string then returns the iterator over parsed clusters.
 * A future implementation will implement an immediate mode parser returning cluster by cluster as the string is
 * parsed.
 *
 * @param {string}   str - String to split.
 *
 * @returns {IterableIterator<string>} An iterator returning grapheme clusters.
 * @yields {string}
 */
function* graphemeIterator(str) {
    for (const grapheme of graphemeSplit(str)) {
        yield grapheme;
    }
}

export { graphemeIterator, graphemeSplit };
//# sourceMappingURL=index.js.map
