var assertjs = assertjs || {};

(function()
{
    "use strict";
    function AssertError(message)
    {
        this.name = "AssertError";
        this.message = message;
    }

    function PreconditionError(message)
    {
        this.name = "PreconditionError";
        this.message = message;
    }
    PreconditionError.prototype = new AssertError("");
    PreconditionError.prototype.constructor = PreconditionError;

    function describe(id, pass, value, against)
    {
        var result = id;
        result += "(";
        result += value;
        if(against !== undefined)
        {
            result += ", ";
            result += against;
        }
        result += ")"
        return result;
    }

    function Messenger(throwError)
    {
        var reports = [],
            failed = 0,
            MakeError = false;
        if(arguments.length > 0 && throwError)
        {
            if(throwError === "precondition")
                MakeError = PreconditionError;
            else
                MakeError = AssertError;
        }

        this.report = function(id, pass, value, against, name)
        {
            name = name || "";
            var description = name + ": " + describe(id, pass, value, against);
            reports.push(
                {
                    id: id,
                    pass: pass,
                    value: value,
                    against: against,
                    name: name,
                    description: description
                }
            );
            if(!pass)
            {
                failed++;
                if(MakeError)
                   throw new MakeError(description);
            }
        };

        this.replay = function(callback, thisArg)
        {
            thisArg = thisArg || this;
            var current;
            for(var i = 0, len = reports.length;i < len;i++)
            {
                current = reports[i];
                callback.call(thisArg, current.id, current.pass, current.value, current.against, current.name, current.description, i);
            }
        };

        this.count = function()
        {
            return reports.length;
        };

        this.countFailed = function()
        {
            return failed;
        }
    }

    Messenger.prototype.empty = function()
    {
        return this.count() < 1;
    };

    Messenger.prototype.allPassed = function()
    {
        return this.countFailed() < 1;
    };

    Messenger.prototype.someFailed = function()
    {
        return this.countFailed() > 0;
    };

    Messenger.prototype.asArray = function()
    {
        function push(id, pass, test, value, against, description)
        {
            this.push(
                {
                    id: id,
                    pass: pass,
                    value: value,
                    against: against,
                    description: description
                }
            );
        }
        var result = [];
        this.replay(push, result);
        return result;
    };

    Messenger.prototype.countPassed = function()
    {
        return this.count() - this.countFailed();
    };

    var comparators =
    {
        equals: function(value, against)
        {
            return value === against;
        },
        lessThan: function(value, against)
        {
            return value < against;
        },
        moreThan: function(value, against)
        {
            return value > against;
        },
        exists: function(value)
        {
            return value !== undefined;
        },
        nulled: function(value)
        {
            return value === null;
        },
        falsy: function(value)
        {
            return !value;
        },
        truthy: function(value)
        {
            return !!value;
        }
    };

    // need to beef this up
    function clone(value)
    {
        return value;
    }

    function Assertion(messenger, value, inverted, description)
    {
        description = description || "";

        function expose(id, comparator)
        {
            return function(against)
            {
                var pass = !!comparator(value, against);
                if(inverted)
                {
                    pass = !pass;
                    id = "not " + id;
                }
                messenger.report(id, pass, value, against, description);
            };
        }

        for(var id in comparators)
            if(comparators.hasOwnProperty(id))
                this[id] = expose(id, comparators[id]);

        if(!inverted)
            this.not = new Assertion(messenger, value, true, description);

        this.value = clone(value);
    }

    function pre(body, specifications)
    {
        return function()
        {
            var args = {},
                messenger = new Messenger("precondition"),
                // must improve the regex, it is too specific for my coding style (e.g. spaces)
                matches = body.toString().match(/^function [a-zA-Z0-9_]*\(([^\)]*)\)/m),
                names = matches[1].split(/, ?/);
            for(var i = 0, len = names.length;i < len;i++)
                args[names[i]] = new Assertion(messenger, clone(arguments[i]), false, names[i]);
            var wrapper =
            {
                enforce: function(description, value)
                {
                    if(arguments.length === 0)
                        throw new TypeError("a value is required")
                    else if(arguments.length === 1)
                    {
                        value = description;
                        description = undefined;
                    }
                    return new Assertion(messenger, value, false, description);
                }
            };

            specifications.call(wrapper, args);
            if(messenger.allPassed())
                return body.apply(this, arguments);
        }
    }

    this.core = this.core || {};

    this.core.AssertError = AssertError;
    this.core.PreconditionError = PreconditionError;
    this.pre = pre;
}).apply(assertjs);