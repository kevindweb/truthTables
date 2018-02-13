$(document).ready(function() {
    var prev_equation = "";
    $("#equation").val("!(!p|q)");

    function error(msg) {
        // make error message
        $("#errorMessage").html(msg);
        $(".message").removeClass("hidden");
    }
    $("#runEquation").on('click', function() {
        $(".close").click();
        // get equation from input
        val = $("#equation").val();
        if (val == prev_equation || !val || val == "(" + prev_equation + ")") return;
        // do not run equation if it has not changed since last button press
        prev_equation = val;
        val = validate(val);
        if (!val) return;
        results = parseParenthesis(val[0]);
        $("#equation").val(results[0]);
        createTable(results[0], results[1], val[1]);
        // results are now in array form
    });
    $(".close").on('click', function() {
        $(".message").addClass("hidden");
    });

    $("#equation").on('keydown', function(e) {
        if (e.keyCode === 13) {
            $("#runEquation").click();
        }
    });

    function isLetter(str) {
        return str.length === 1 && str.match(/[a-z]/i);
    }

    function uniq(a) {
        var prims = {
                "boolean": {},
                "number": {},
                "string": {}
            },
            objs = [];

        return a.filter(function(item) {
            var type = typeof item;
            if (!item) {
                return false;
            }
            if (type in prims)
                return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
            else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
        });
    }

    function validate(eq) {
        // this checks for the number of parenthesis, and the number of variables in equation
        var variableMap = {};
        eq = "(" + eq + ")";
        var len = eq.length;
        var acceptedOperators = ['(', ')', '!', '&', '|'];
        var removeDuplicates = "";
        for (var i = 0; i < len; i++) {
            // gets each equation inside parenthesis
            var thisChar = eq.charAt(i);
            if (thisChar !== " " && !isLetter(thisChar)) {
                if (variableMap[thisChar]) {
                    variableMap[thisChar]++;
                } else {
                    variableMap[thisChar] = 1;
                }
            }
            if (thisChar == '(' || thisChar == ')' || isLetter(thisChar)) {
                removeDuplicates += thisChar;
            } else if (!(thisChar == eq[i - 1])) {
                removeDuplicates += thisChar;
            }
        }
        for (prop in variableMap) {
            if (variableMap.hasOwnProperty(prop)) {
                // check to see if input equation uses incorrect operators
                var index = acceptedOperators.indexOf(prop);
                if (index < 0) {
                    // for example, if there was a + sign in the equation, error out
                    error("Refer to the Accepted Operators at the bottom.");
                    return null;
                }
            }
        }
        if (variableMap["("] !== variableMap[")"]) {
            // this means that there was an open parenthesis
            error("Check your parenthesis!");
            return null;
        } else {
            var onlyVariables = eq.split(/[^A-Za-z]/);
            onlyVariables = uniq(onlyVariables);
            // separates operators/parenthesis from the variables
            if (onlyVariables.length > 5) {
                error("Please use less than 6 variables.");
                return null;
            }
        }
        result = [removeDuplicates, onlyVariables];
        return result;
    }

    function parseParenthesis(eq) {
        var a = [],
            r = [];
        var lengthy = eq.length;
        for (var i = 0; i < lengthy; i++) {
            // separate operations by parenthesis
            if (eq.charAt(i) == '(') {
                a.push(i);
            }
            if (eq.charAt(i) == ')') {
                r.push(eq.substring(a.pop() + 1, i));
            }
        }
        lengthy = r.length;
        var placeholder = [];
        eq = r[lengthy - 1];
        for (var j = lengthy - 1; j >= 0; j--) {
            // remove duplicates that are have one more set of parenthesis
            var removeParenthesis = r[j].substring(1, r[j].length - 1);
            var index = r.indexOf(removeParenthesis);
            if (index < 0) {
                placeholder.push(r[j]);
            }
        }
        return [eq, placeholder];
    }

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    function getPermutations(numVars) {
        var arr = [];
        // 1 << numVars is similar to 2^numVars
        for (var i = (1 << numVars) - 1; i >= 0; i--) {
            var placeholder = [];
            // [!!(i & (1 << 3)), !!(i & (1 << 2)), !!(i & (1 << 1)), !!(i & 1)];
            for (var x = numVars - 1; x >= 0; x--) {
                if (x == 0) {
                    placeholder.push(!!(i & 1));
                } else {
                    placeholder.push(!!(i & (1 << x)));
                }
            }
            arr.push(placeholder);
        }
        return arr;
    }

    function createTable(equation, headers, variables) {
        $("#headers").empty();
        var element;
        var cellsList = [];
        var varLength = variables.length;
        var numRows = 1 << varLength;
        // cellsList rows length will be 2^(variables.length)
        var allHeaders = headers.concat(variables);
        var lengthy = allHeaders.length;
        // columns length is determined by number of headers + number of variables
        $("#tableBody").empty();
        for (elem in variables) {
            element = "<th>" + variables[elem] + "</th>";
            $("#headers").append(element);
        }
        for (var i = headers.length - 1; i >= 0; i--) {
            element = "<th>" + headers[i] + "</th>";
            $("#headers").append(element);
        }
        var boolValue;
        var currentRow = [];
        window.headers = headers;
        var len = headers.length;
        // create a special string for each equation
        // that allows us to insert the truth value for that row
        for (var z = len - 1; z > -1; z--) {
            var zLen = headers[z].length;
            for (var q = len - 1; q > z; q--) {
                // loop through previous equations
                var repl = headers[q].length;
                while (true) {
                    var index = headers[z].indexOf(headers[q]);
                    if (index < 0) {
                        break;
                    }
                    // put a number instead of equation for easier logical parsing
                    headers[z] = headers[z].replace(headers[q], (len - (q + 1)));
                }
            }
        }
        var booleanPermutations = getPermutations(varLength);
        // get a list of the permutations of (true and false) based on number of variables
        for (var j = 0; j < numRows; j++) {
            var elem = $(document.createElement('tr'));
            for (var x = 0; x < lengthy; x++) {
                if (x >= varLength) {
                    var eq = headers[len - (x - varLength) - 1].replaceAll(/\(|\)|\ /, "");
                    var numLetter = eq.split(/\&|\|/);
                    var nlLen = numLetter.length;
                    eq = (eq.split("")).filter(function(e) {
                        return e == "&" || e == "|";
                    });
                    for (var n = 0; n < nlLen; n++) {
                        var val = false;
                        var flip = false;
                        if(numLetter[n][0] == "!"){
                            flip = true;
                            numLetter[n] = numLetter[n].substring(1, numLetter[n].length);
                        }
                        if (isNaN(numLetter[n])) {
                            var index = variables.indexOf(numLetter[n]);
                            if (index > -1) {
                                val = currentRow[index] == 'F' ? false : true;
                            } else {
                                error("Error with variable names, please check the equation.");
                                return null;
                            }
                        } else {
                            var num = Number(numLetter[n]);
                            val = currentRow[num + (nlLen + 1)] == 'F' ? false : true;
                        }
                        if(flip){
                            val = !val;
                        }
                        numLetter[n] = val;
                    }
                    var result = false;
                    for (var b = 0; b < nlLen; b++) {
                        if(nlLen == 1){
                            result = numLetter[0];
                            break;
                        }
                        if (eq[b] == "&") {
                            if (b) {
                                result = result && numLetter[b + 1];
                            } else {
                                result = numLetter[b] && numLetter[b + 1];
                            }
                        } else {
                            if (b) {
                                result = result || numLetter[b + 1];
                            } else {
                                result = numLetter[b] || numLetter[b + 1];
                            }
                        }
                    }
                    // these are the equations to solve
                    boolValue = result ? 'T' : 'F';
                } else {
                    // these are the variables
                    boolValue = booleanPermutations[j][x] ? 'T' : 'F';
                }
                elem.append("<td>" + boolValue + "</td>");
                currentRow.push(boolValue);
            }
            // console.log("currentRow", currentRow);
            elem.appendTo("#tableBody");
            currentRow = [];
        }
    }
    $("#runEquation").click();
});
