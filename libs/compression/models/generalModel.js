/*
 * Experimental approach for compress / decompression of any structured data
 */

module.exports.objectData = objectData;
module.exports.objectPattern = objectPattern;
module.exports.rebuildObject = rebuildObject;

/***********
 * Methods *
 ***********/

function objectData(s, pat) {
    var i = 0;
    var dat = [];
    for (var k = 0; k < pat.length; k++) {
        var tok = pat[k];
        if (i >= s.length) return [s];
        var j = s.indexOf(tok, i);
        console.log('token=' + tok + ' i=' + i + ' j=' + j);
        if (j == -1) return [s];
        dat.push(s.substring(i, j));
        i = j + tok.length;
    }
    dat.push(s.substr(i));
    return dat;
}

function objectPattern(stringA, stringB) {
    return longestCommonTokenSubsequence(stringA, stringB);
}

function rebuildObject(dat, pat) {
    if (dat.length != pat.length + 1)
        return "ERROR, dat.length should be " + (pat.length + 1);
    var out = dat[0];
    for (var i = 0; i < pat.length; i++) out += pat[i] + dat[i + 1];
    return out;
}

/***********
 * Helpers *
 ***********/

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function flattenPattern(pat){
    var out='';
    /*for (var i=0; i<pat.length; i++){
     if (i>0) out+='|';
     if ()
     }*/
    out=pat.join('|');
    return out;
}

//any non-number, non-letter is considered a separator
function isASeparator(x) {
    if (x >= 'a' && x <= 'z') return false;
    if (x >= 'A' && x <= 'Z') return false;
    if (x >= '0' && x <= '9') return false;
    return true;
}

function escapeString(str) {

}

function unescapeString(str) {

}

function safeMatchesAt(s, t, i, j) {
    if (i >= s.length ||
        j >= t.length ||
        i < 0 ||
        j < 0 ||
        s[i] != t[j]) {
        return false;
    }

    return true;
}

/*
 //matching criteria: at least two consecutive matches required unless at the end of the string
 function matchesAt(s,t,i,j,d=1){
 if (!safeMatchesAt(s,t,i,j)) return false;
 //enforcing minimnum two-letter matches
 //  if (i+d>=s.length || j+d>=t.length ||	i+d<0 || j+d<0) return false;
 if (!safeMatchesAt(s,t,i+d,j+d)) return false;
 return true;
 }
 */

//token-ify a string. returns array of [index,len]
function getTokenList(s) {
    var li = [];
    for (var i = 0, j = 0; i < s.length; i++) {
        if (isASeparator(s[i])) {
            if (i - j > 0) li.push([j, i - j]);
            li.push([i, 1]);
            j = i + 1;
        }
    }
    if (i - j > 0) li.push([j, i - j]);
    return li;
}

//returns LCS *pieces*
function longestCommonTokenSubsequence(s, t) {
    var sli = getTokenList(s);
    var tli = getTokenList(t);
    var n = sli.length;
    var m = tli.length;

    var dp = [];
    for (var i = 0; i < n + 2; i++) {
        dp[i] = [];
        for (var j = 0; j < m + 2; j++)
            dp[i].push(0);
    }

    for (var i = 0; i <= n; i++) dp[i][m + 1] = 0;
    for (var j = 0; j <= m; j++) dp[n + 1][j] = 0;
    for (var i = n; i >= 0; i--) {
        for (var j = m; j >= 0; j--) {
            dp[i][j] = Math.max(dp[i][j + 1], dp[i + 1][j]);
            if (i > 0 && j > 0) {
                var stoken = s.substring(sli[i - 1][0], sli[i - 1][0] + sli[i - 1][1]);
                var ttoken = t.substring(tli[j - 1][0], tli[j - 1][0] + tli[j - 1][1]);
                //console.log(stoken+'|'+ttoken);
                if ( //sli[i-1][1]==sli[j-1][1] &&
                (' ' + stoken) === (' ' + ttoken)) {
                    dp[i][j] = Math.max(dp[i][j], dp[i + 1][j + 1] + 1);
                }
            }
        }
    }
    var pat = [];
    var pati = [];
    var out = "";
    for (var i = 0, j = 0; i <= n && j <= m;) {
        var matched = false;
        var stoken = '';
        if (i > 0 && j > 0) {
            stoken = s.substring(sli[i - 1][0], sli[i - 1][0] + sli[i - 1][1]);
            var ttoken = t.substring(tli[j - 1][0], tli[j - 1][0] + tli[j - 1][1]);
            if ( //sli[i-1][1]==sli[j-1][1] &&
            (' ' + stoken) === (' ' + ttoken) &&
            dp[i][j] == dp[i + 1][j + 1] + 1) {
                matched = true;
            }
        }
        if (matched) {
            pat.push(stoken);
            pati.push([i, j]);
            i++;
            j++;
        } else {
            if (dp[i][j] == dp[i][j + 1]) j++;
            else i++;
        }
    }
    //detect repeats
    /*  var lastseen=[];
     var pat2=pat;
     for (var i=0; i<pat.length; i++){
     if (pat[i] in lastseen){
     var beg=lastseen[pat[i]];
     var j;
     for (j=1; i+j<pat.length && pat[beg+j]===pat[i+j]; j++);
     if (j>=i-beg){
     pat=pat.splice(beg,(1+j/(i-beg))*(i-beg),pat.slice(beg,i));
     pat[i].subtree=true;
     i=beg;
     }
     else lastseen[pat[i]]=i;
     }
     else lastseen[pat[i]]=i;
     }
     pat=pat2;
     */

    //merge tokens that are next to each other
    var patunique = [pat[0]];
    for (var i = 1; i < pat.length; i++) {
        if (pati[i - 1][0] == pati[i][0] - 1 && pati[i - 1][1] == pati[i][1] - 1) {
            patunique[patunique.length - 1] += pat[i];
        } else {
            patunique.push(pat[i]);
        }
    }
    return patunique;
}

//returns LCS *pieces*
function longestCommonSubsequence(s, t, matchesAt) {
    var n = s.length,
        m = t.length;
    var dp = [];
    for (var i = 0; i < n + 2; i++) {
        dp[i] = [];
        for (var j = 0; j < m + 2; j++)
            dp[i].push(0);
    }

    for (var i = 0; i <= n; i++) dp[i][m + 1] = 0;
    for (var j = 0; j <= m; j++) dp[n + 1][j] = 0;
    for (var i = n; i >= 0; i--) {
        for (var j = m; j >= 0; j--) {
            dp[i][j] = Math.max(dp[i][j + 1], dp[i + 1][j]);
            var d = 0;
            if (matchesAt(s, t, i - 1, j - 1)) {
                dp[i][j] = Math.max(dp[i][j], dp[i + 1][j + 1] + 1);
            }
        }
    }
    var pat = [];
    var out = "";
    for (var i = 0, j = 0; i <= n && j <= m;) {
        var matched = false;
        if (matchesAt(s, t, i - 1, j - 1, -1) &&
            dp[i][j] == dp[i + 1][j + 1] + 1) {
            matched = true;
        }
        if (matched == false || isASeparator(s[i - 1])) {
            if (out.length > 0) {
                pat.push(out);
                out = "";
            }
        }
        if (matched) {
            if (isASeparator(s[i - 1]))
                pat.push(s[i - 1]);
            else out += //'('+i+','+j+')'+
                s[i - 1];
            i++;
            j++;
        } else {
            if (dp[i][j] == dp[i][j + 1]) j++;
            else i++;
        }
    }
    return pat;
}