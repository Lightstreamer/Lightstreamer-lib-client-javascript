/*
 * Copyright (C) 2012 Lightstreamer Srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export default /*@__PURE__*/(function() {  
  var engineChunks = {
    
    ////;-) chunk of encrypted copyright string
    cpcnk1: "28442324223623531823424",

    ////;-) chunk of encrypted copyright string
    cpcnk2: "52312352492633183053182",

    ////;-) chunk of encrypted copyright string
    cpcnk3: "41239251304236249241253",

    ////;-) chunk of encrypted copyright string
    cpcnk4: "24923623423523424624724",

    ////;-) chunk of encrypted copyright string
    cpcnk5: "52423042312312313182482",

    ////;-) chunk of encrypted copyright string
    cpcnk6: "39318229234236249238239",
 
    ////;-) chunk of encrypted copyright string
    cpcnk7: "23623831824225323323425",
 
    ////;-) chunk of encrypted copyright string
    cpcnk8: "12492422422492342402770"
    
  };

  function calcKey(ckey) {
    var klen = 0;
    var ckeylen = ckey.length;
    for(var i = 0; i < ckeylen; i++) {
      klen += ckey.charCodeAt(i);
    }
    return parseInt(klen);
  }

  function myDecode(msg, _key, _start, pad, portante) {
// alert("chiamata " + _start);
    var jjj = 3;
    var temp;
    var jump2 = _start;
    var _max = _start - pad;
    var res = "";
    var klen = calcKey(_key.toString());
// alert("chiave " + klen);
    if (klen > 0) {
      var dtxtlen = msg.length;
      if (dtxtlen > 0) {
        var i;
// alert("lunghezza totale " + dtxtlen);
        for (i = 0; jump2 + jjj - i <= dtxtlen; i += 3) {
// alert("indice " + jump2);
          var j = i;
          if (_max > 0) {
            for (j = klen * 3; j >= _max; j -= _max);
          }
// alert("indice casuale " + j);
          var temp1 = msg.substring(i, jjj - 1);
// alert("primo numero " + temp1);
          var temp2 = msg.substring(j, j + 2);
// alert("secondo numero " + temp2);
          var temp3 = msg.substring(jump2, jump2 + jjj - i);
// alert("correzione " + temp3);
          temp = parseInt(temp1) - parseInt(temp2) + portante - parseInt(temp3);
// alert("codice " + temp);

/*
INSTRUCTIONS FOR THE ENCODING OF THE VERSION NUMBER

--- uncomment the javascript lines shown below
--- update the "target" string with the new version
--- make sure that the "encoding" variable is evaluated
    to true in correspondence with this case
--- change the value to the "portante" call parameter,
    in Lightstreamer.bind in lsengine.js, remaining between 250 and 900
--- open lsengine.html in the browser; overcome any initial errors;
    if in the end it is not enough, then launch a complete demo based
    on these sources, using Lightstreamer Server to deliver the pages
    (ie the domain should not be used; this avoids complications
    in generating the popup with the result)
--- wait for an alert with the encoding and then a popup containing
    3 instructions of the form: extraN = "xxxxx";
--- replace the 3 instructions with the 3 similar ones
  in sparse positions in Lightstreamer.bind in lsengine.js
    also replacing the characters '.' in the instructions with any numbers
--- close the browser and the popup, which are no longer needed
--- replay javascript lines,
    but leave the changes in "obbiettivo" and in lsengine.js

Similarly, other managed strings can be re-encoded.
*/


// START ENCODING ALGORITHM
/*
          if (i == 0) {
            var codifica = false;
            var risultato = "";
            if (_start == 6) {
              var obbiettivo = "Intellectual property of www.lightstreamer.com - Weswit srl";
              var chunk = "Lightstreamer.cpcnk";
            } else if (_start == 116) {
              var obbiettivo = "LS_client_version=6.1&";
              var chunk = "Lightstreamer.extra";
              codifica = true;
              // chiamato anche con alcuni risultati del caso 6
            } else if (_start == 51) {
              var obbiettivo = "source";
              var chunk = "Lightstreamer.extraN";
            } else if (_start == 74) {
              var obbiettivo = "LIGHTSTREAMER";
              var chunk = "Lightstreamer.extraV";
              // chiamato anche con alcuni risultati del caso 51
            }
            // le var resteranno dichiarate
          }
          if (codifica) {
            temp += parseInt(temp3);
// alert("base " + temp);
            var chObb = obbiettivo.charAt(obbiettivo.length - 1 - (i / 3));
// alert("carattere voluto " + chObb);
            for (tempTest = 0; tempTest < 128; tempTest++) {
              var tTest = unescape('%' + tempTest.toString(16));
              if (tTest == chObb) {
                break;
              }
            }
// alert("codice voluto " + tempTest);
            if (tempTest == 128) {
              alert("non si puo'");
            }
            var valObb = temp - tempTest;
            if (valObb < 0) {
              alert("non si riesce; troppo basso");
            }
            if (valObb > 999) {
              alert("non si riesce; troppo alto");
            }
// alert("correzione voluta " + valObb);
            var numObb = "000" + valObb;
            var strObb = numObb.substring(numObb.length - 3);
// alert("stringa " + strObb);
            risultato += strObb;
// alert("chiave accumulata " + _key);
            if (jump2 + jjj - i + 3 > dtxtlen) {
              var pos;
              var padding = ".......................";
              for (pos = 0; pos + 23 <= _start; pos += 23);
// alert("posizione iniziale risultato " + _start);
// alert("inizio primo chunk risultato " + pos);
              var pref = padding.substring(0, _start - pos);
// alert("padding iniziale " + pref);
              var end = _start + risultato.length;
              while (pos < end) {
                pos += 23;
              }
// alert("posizione finale risultato " + end);
// alert("fine ultimo chunk risultato " + pos);
              var postf = "";
              if (pos != end) {
                postf = padding.substring(0, pos - end);
              }
// alert("padding finale " + postf);
              risultato = pref + risultato + postf;
              alert("Obbiettivo: " + obbiettivo);
              alert("Stringa Definitiva: " + risultato);
              var n = 1;
              var dichiarazione = "";
              for (pos = 0; pos < risultato.length; pos += 23) {
                var dich = chunk + n + " = \"" + risultato.substring(pos, pos + 23) + "\";";
                dichiarazione += (dich + "<BR>");
                n++;
              }
              var w = window.open("", "tmp", null, true);
              w.document.write("Obbiettivo: " + obbiettivo + "<BR>");
              w.document.write("Stringa Definitiva: " + risultato + "<BR>");
              w.document.write(dichiarazione);
              w.document.close();
            }
            temp -= parseInt(strObb);
// alert("verifica codice " + temp);
          }
*/       
// END ENCODING ALGORITHM


          var t = unescape("%" + temp.toString(16));
// alert("carattere " + t);
          res = t + res;
// alert("stringa accumulata " + res);
          jjj += 3;
          jump2 += 3;
          klen += temp;
        }
      }
    }
// alert("risultato " + res);
    return res;
  }
  
  var Copyright = {

      getCopyright: function() {
        // initialize the copyright with the following message:
        // "Intellectual property of www.lightstreamer.com - Weswit srl"
        return myDecode("" + engineChunks.cpcnk1 + engineChunks.cpcnk2 + engineChunks.cpcnk3 + engineChunks.cpcnk4 + engineChunks.cpcnk5 + engineChunks.cpcnk6 + engineChunks.cpcnk7 + engineChunks.cpcnk8, "document", 6, 7, 350);

        // 6 = (8 chunks of length 23) - (59 groups of 3 digits) - (1 free offset)
        // 6 >= (0 base chunks of length 23)
        // 6 - 7 = (0 base chunks of length 23) truncate every 3 chars - (1 not relevant offset)
        

        //LS_vF1c = copyright; 
      }
  };
  
  
  return Copyright;
})();
  


