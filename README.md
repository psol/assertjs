# assert.js
## Assertion and test framework in JavaScript

assert.js helps to industrialize JavaScript projects. It focuses on formal (executable) specifications and testing.
It was inspired by my own experience, the assert() macro in C++/Objective-C, Design-by-contract™ (of Eiffel/Meyer fame),
TDD and more.

**Please note that the project is still in the analysis/design phase. The code currently commited is used for
proof-of-concept and experimentation. The discussion below reflects current understanding which may (will?) change.**

### Services

Specifically assert.js will offer 4 services:

1. embed formal specifications in JavaScript functions, including pre-, post-conditions, invariants and assertions
2. optionally validate the formal specifications at run-time
3. optionally compile the formal specifications (and mock objects) into tests
4. optimize the production JavaScript by removing the specifications from a deployment version

Let's review those one at a time. Formal specifications specify what a function does, not how it does it. They are
written formally in JavaScript and serve 2 purposes:

* document the function specifications
* verify that the function implements its specifications

Let's look at an example (syntax is still tentative) for a function that return it's argument increment by 1:

    function increment(a) {
        return a + 1;
    }
    assert(increment,{
        pre: function(args) {
            args.a.number;
        },
        post: function(args, result) {
            result.equals(args.a + 1);
        }
    });

Don't see too much in the function names, etc. This is only intended to demonstrate the principles.

Also I agree that this level of specifications is probably overkilled given the simplicity of the function but
it's a simplest example to demonstrate a powerful principle. The specifications document that:

* the function only expect numbers as valid arguments (pre-condition)
* the function will return its parameter incremented by 1 (post-condition)

As you can see, the body of the function implements the specification.

Note that this is the specification for **this** function. If you want a more sophisticated function that accepts
strings and convert them to numbers before incrementing you could specify that as well. It's up to you to write
the specifications you need.

There are a number of benefits to writing such specifications, the most important ones being:

* the specifications are located close to the actual implementation so it's easy to reference/update one when
implementing the other
* the specifications are unambiguous, being executable code
* the specifications can be executed to help test/verify the implementation

Indeed armed with these specifications, assert.js can do one of three things:

* in production, do nothing and execute only the body of the function
* in development, at run-time, verify that the function satisfies its specifications by running the code in the pre and
post-conditions respectively before and after each call to `increment()`
* in development, run unit tests calling the function with numbers verifying that the post-condition is always met

Most assertion frameworks only offer the first two options but many projects mandate the use of automated testing so
having the third option may be the difference between winning a contract or not. You should decide, not the framework.

Last but not least the framework can easily bypass the executation of specifications at runtime but they still bloat
the production code. We don't want slow downloads so a minifier will be provided to rewrite the above function as follow
for deployment:

    function increment(a) { return a + 1; }

### Principles

Some of the guiding principles in designing assert.js are:

* agnostic: the framework should not impose a methodology or an overal architecture. It should be a tool that provide
a service as best as possible and let you worry about the big picture
* programmer-friendly: no one likes to write unit tests or assertions, assert.js will make it as painless as possible

You're a professional so you know how to structure and optimize your code to serve the needs of your users. The tools
should not impose restrictions such as mandate assertions everywhere. Rather it should give you the option to apply it
as and how you see fit.

This is one of the reasons to offer both run-time validation or unit tests… the specifications can provide both so
you should choose the one that make the most sense for your project.

Some examples of programmer-friendliness include sensible defaults and shortcuts. For example, many functions depend
on their input to exist so you quickly end up with code such as:

    pre: function(args) {
        exist(args.a);
        exist(args.b);
        exist(args.b);
        // ...
    }

which is a pain to write and actually obscures the business specifications. It makes more sense to provide shortcuts
such as:

    pre: exist(args.all)

Again do not be concerned with the function names, etc. at this time. The only thing I know at this point is that
they are not adequate. It is guaranteed to change. This document is about the principles and the examples are just
meant to illustrate the principles.