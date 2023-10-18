/*
Info and notes:
- During battle, a 56x56 pixels square area is designated to show the opposing pokemon
- That area is divided by 49 tiles (7x7), each consisted of 8x8 pixels
- Each tile then contains 8*8*2 = 128 bits, or 16 bytes total
- Buffer size for the Entire sprite then takes up to 56*56*2 = 6272 bits, or 784 bytes total
- Graphics have a bit-depth of 2 bits per pixel, so 4 colors total
    - 00: white
    - 10: light gray
    - 01: drak gray
    - 11: black
- Each bit pair is stripped from one another, that way we have two separate images (2 bitplanes)
    - Example:
        00 00 10 10     \   0 0 1 1       0 0 0 0
        01 01 00 11   -- \  0 0 0 1   &   1 1 0 1
        01 01 10 11   -- /  0 0 1 1       1 1 0 1
        11 11 01 11     /   1 1 0 1       1 1 1 1
- The two bitplanes are then compressed and stored one after the other in memory 
- Pokemon sprites smaller than 7x7 have the empty tiles ommited before compression
- 1 extra byte determines the size of the sprite.
    - First 4 bits determine the box height and
    - Last 4 bits determine the box width
    - Example:
        - 5x5: 01010101 ($55)
        - 7x7: 01110111
    - It's bundled with the sprite data and in a separate table for the algorith to insert blank tiles around it if < 7x7
- Sprite data is normally found between $4000 and $7FFF

Reference:
- https://www.youtube.com/watch?v=ZI50XUeN6QE&ab_channel=RetroGameMechanicsExplained

Symbols that we can use to represent the 4 gba colors (white, light gray, dark gray and black)
- 00 White      : &#9633; □
- 10 Light Gray : &#9640; ▨
- 01 Dark Gray  : &#9641; ▩
- 11 Black      : &#9632; ■
⬜⬛*️⃣❎🟫🟨

Each pokemon has an internal ID and pokedex number.
- Name and Dex numbers are derived from the Internal ID
- Removed (missingno) pokemons have unused Internal  IDs
- Sprite is derived from dex number
Ex:
- Bulbasaur: ID 153, Dex 001, Sprite $55 $4000
- Rhydon:    ID 001, Dex 112

Example of sprite data:
0101 width
    0101 height
        1 primary buffer (which bitplane was processed first)
         1 initial packet type of the data
          N compressed datafor primary bitplane (no terminator or explicit length set)
           11 encoding mode (01, 10 or 11)
             1 initial packet
              N compressed data for secondary bitplane

RLE - Run Length Encoding
- every unit of data holds 2 binary digits
- RLE only applies to 00s (even for 1 instance of 00)
- Data packets never contain 00s (everything else)
- RLE and data packets always alternate one after the other (so only the first packet needs to identify itself)

R =00 - RLE : repeat 00, N times
R!=00 - Data: copy units until 00 is reached

For RLE...

N=LV
    L = length of N in bits
    V = value of N
    
To encode:
- N = 45 (sequences of 00s) = 101101
- Since binary digits always start with one, the leading 1 gets stripped
- V = 01101
- L = (N-V)-10 = (101101-01101)-10 = 100000-10 = 11110
- Encoded N = concat(L,V) = concat(11110,01101) = 1111001101
*/

function assertBinsSame(a, b) {
    console.assert(a === b, `${a.toString(2)} (${a}) === ${b.toString(2)} (${b})`)
}

function rle_encode(n) {
    // e.g. n=0b101101 (45)

    // offset to deal with 1
    n = n + 1 // n=0b101110
    //console.log(`n=${n}, and binN=${n.toString(2)}`)
    
    let v = n - Math.pow(2, n.toString(2).length - 1) // v=0b1110
    //console.log(`v=${v.toString(2)}`)
    
    let l = n - v - 0b10 // l=0b11110
    //console.log(`l=${l.toString(2)}`)

    let encoded = (l << l.toString(2).length) | v // encoded=0b1111001110
    //console.log(`encoded=${encoded.toString(2)}`)

    return encoded
}

assertBinsSame(rle_encode(0b01), 0b00) // 1
assertBinsSame(rle_encode(0b10), 0b01) // 2
assertBinsSame(rle_encode(0b101101), 0b11110_01110) // 45
assertBinsSame(rle_encode(0b1111011100110010), 0b111111111111110_111011100110011) // 63282

/*
To unencode:
- Encoded N = 1111001101
- L = Read 1s until a terminator 0 = 11110
- N = Read L number of bits after terminator = 01101
- N = L + N + 10 = 11110 + 01101 + 1 = 101101
*/
function rle_decode(encoded) {
    let l = "", n = "";
    const strN = encoded.toString(2);
    for (let i = 0; i < strN.length; i++) {
        const charAt = strN.charAt(i)
        l += charAt
        if (charAt == 0) break
    }
    //console.log(`l=${l}`)
    for (let i = l.length; i < (l.length * 2); i++) {
        const charAt = strN.charAt(i)
        n += charAt
    }
    if (!n) n='0'
    //console.log(`n=${n}`)
    const decoded = parseInt(l, 2) + parseInt(n, 2) + 1;
    //console.log(`decoded=${decoded.toString(2)} (${decoded})`)
    return decoded
}

assertBinsSame(rle_decode(0b11110_01110), 0b101101)
assertBinsSame(rle_decode(0b11110_01110_111111), 0b101101) // extra bits after N are ignored
assertBinsSame(rle_decode(0b01), 0b10)
assertBinsSame(rle_decode(0b00), 0b1)

// "SMALL EXAMPLE"
/*

*/

function decompress_bp(bitplane) {
    let isRle = bitplane.charAt(0) == '0'
    let decompressed = '';
    for (let i = 1; i < bitplane.length; i++) {
        if (isRle) {
            
        }
    }
}

let compressed   = 0b0100110110011010_0011111110100011_011110110101000
let decompressed = 0b0000000010110000_0000000000000000_0001111111010000_10111101101010n

console.log('finished script')
