﻿// https://github.com/borisyankov/DefinitelyTyped/blob/master/jquery/jquery.d.ts

interface BaseMicroJQEventObject extends Event {
    preventDefault(): any;
    stopPropagation(): void;
    which: number;
}

interface MicroJQInputEventObject extends BaseMicroJQEventObject {
}

interface MicroJQMouseEventObject extends MicroJQInputEventObject {
}

interface MicroJQKeyEventObject extends MicroJQInputEventObject {
    keyCode: number;
    shiftKey: boolean;
}

interface MicroJQEventObject extends BaseMicroJQEventObject, MicroJQInputEventObject, MicroJQMouseEventObject, MicroJQKeyEventObject {
}

interface MicroJQEventHandler {
    (eventObject?: MicroJQEventObject): void;
}

interface MicroJQ {
    length: number;
    [key: number]: HTMLElement;
    toArray(): Element[];
    find(selector: string): MicroJQ;
    first(): MicroJQ;
    contents(): MicroJQ;
    clone(): MicroJQ;
    each(func: (index: number, elem: Element) => any): MicroJQ;
    data(key: string): any;
    attr(attributeName: string, value: string): MicroJQ;
    attr(attributeName: string, value: number): MicroJQ;
    removeAttr(attributeName: string);
    width(): number;
    height(): number;
    on(events: string, handler: MicroJQEventHandler): MicroJQ;
    off(events: string, handler?: MicroJQEventHandler): MicroJQ;
    append(content1: MicroJQ, ...content2: any[]): MicroJQ;
    append(content1: Element, ...content2: any[]): MicroJQ;
    append(content1: any[], ...content2: any[]): MicroJQ;
    append(content1: string, ...content2: any[]): MicroJQ;
    text(txt: string): MicroJQ;
    addClass(className: string): MicroJQ;
    removeClass(className?: string): MicroJQ;
    css(propertyName: string, value: string): MicroJQ;
    blur(): MicroJQ;
    focus(): MicroJQ;
    remove(): MicroJQ;
}

interface JQueryStaticCommon {
    (element: Element): MicroJQ;
    (element: Node): MicroJQ;
    (elements: Element[]): MicroJQ;
}

interface JQueryStatic extends JQueryStaticCommon {
    fn: any;
}

interface MicroJQStatic extends JQueryStaticCommon {
    forEach<T>(array: Indexable<T>, callbackfn: (value?: T, index?: number, array?: T[]) => void, thisArg?: any);
    objectEach<T>(obj: {[key: string]: T}, callback: (key: string, value: T) => void);
    map<T, U>(array: Indexable<T>, callback: (value?: T, index?: number, array?: Indexable<T>) => U, thisArg?: any): U[];
    indexOf<T>(array: T[], item: T): number;
    trim(st: string): string;
    //isArray(obj: any): boolean;
    ready(fn: () => void): void;
}

interface Window {
    microJQ: MicroJQStatic;
}

interface ElementEvents {
    [key: string]: MicroJQEventHandler[];
}

interface ElementStore {
    events: ElementEvents;
    handler: (event: Event) => void;
}

interface ElementStoreMap {
    [key: string]: ElementStore;
}

interface Element {
    microjqid: string;
}

interface Indexable<T> {
    length: number;
    [index: number]: T;
}

(function (window: Window, document: Document, undefined?: any) {
    'use strict';

    // internals

    //var KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
    var elementStore: ElementStoreMap = {};
    var elementCounter: number = 0;

    function nextId(): string {
        return '' + (++elementCounter);
    }

    function getElementStore(element: Element): ElementStore {
        var elementId = element.microjqid;
        var store = elementId && elementStore[elementId];

        if (!store) {
            element.microjqid = elementId = nextId();
            elementStore[elementId] = store = { events: {}, handler: undefined };
        }

        return store;
    }

    function indexOf<T>(array: T[], item: T): number {
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }

    function forEach<T>(array: Indexable<T>, callbackfn: (value?: T, index?: number, array?: T[]) => void, thisArg?: any) {
        for (var k = 0; k < array.length; k++) {
            callbackfn.call(thisArg, array[k], k, array);
        }
    }

    function map<T, U>(array: Indexable<T>, callback: (value?: T, index?: number, array?: Indexable<T>) => U, thisArg?: any): U[] {
        var result: U[] = [];
        for (var k = 0; k < array.length; k++)
            result.push(callback.call(thisArg, array[k], k, array));
        return result;
    }

    function objectEach<T>(obj: {[key: string]: T}, callback: (key: string, value: T) => void) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                callback.call(value, key, value);
            }
        }
    }

    function toArray<T>(array: Indexable<T>): T[] {
        return map(array, (item: T) => item);
    }

    var trim: (st: string) => string = String.prototype.trim
        ? (st: string) => st.trim()
        : ((): { (st: string): string } => {
            var trimregex = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
            return (st: string) => st.replace(trimregex, '');
        })();

    function arrayRemove<T>(array: T[], elem: T) {
        var idx = indexOf(array, elem);
        if (idx >= 0)
            array.splice(idx, 1);
    }

    function filter<T>(array: Indexable<T>, fn: (value: T, index: number) => boolean): T[] {
        var result: T[] = [];
        forEach(array, (value: T, i: number) => {
            if (fn(value, i))
                result.push(value);
        });
        return result;
    }

    function spaceSplit(st: string): string[] {
        return filter(st.split(' '), (item: string) => item.length !== 0);
    }

    function isArray(obj: any): boolean {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            (<MSEventAttachmentTarget> <any> el).attachEvent('on' + type, callback);
    }

    function removeEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
        if (el.removeEventListener)
            el.removeEventListener(type, callback, false);
        else
            (<MSEventAttachmentTarget> <any> el).detachEvent('on' + type, callback);
    }

    var MicroJQEvent = (function () {
        function MicroJQEvent(event: Event) {
            this.originalEvent = event;
            this.type = event.type;
            this.target = event.target || event.srcElement;
            this.which = (<KeyboardEvent> event).which || (<KeyboardEvent> event).keyCode;
        }
        MicroJQEvent.prototype.preventDefault = Event.prototype.preventDefault
            ? function () { this.originalEvent.preventDefault(); }
            : function () { (<MSEventObj> this.originalEvent).returnValue = false; };
        MicroJQEvent.prototype.stopPropagation = Event.prototype.stopPropagation
            ? function () { this.originalEvent.stopPropagation(); }
            : function () { (<MSEventObj> this.originalEvent).cancelBubble = true; };
        return MicroJQEvent;
    })();

    function createEventHandler(element: Element, events: ElementEvents): (event: Event) => void {
        function eventHandler(event: Event) {
            var eventFns = events[event.type];
            if (eventFns && eventFns.length) {
                var mjqevent = new MicroJQEvent(event);
                if (eventFns.length > 1)
                    eventFns = toArray(eventFns);  // make copy to avoid changes while looping
                forEach(eventFns, (fn: MicroJQEventHandler) => {
                    fn.call(element, mjqevent);
                });
            }
        }
        return eventHandler;
    }

    function elementOff(el: Element, type?: string, fn?: MicroJQEventHandler) {
        var store = getElementStore(el);
        var events = store.events;
        var handler = store.handler;

        if (!handler) return;

        if (type) {
            forEach(spaceSplit(type), (type: string) => {
                if (fn) {
                    var listeners = events[type];
                    if (listeners) {
                        arrayRemove(listeners, fn);
                        if (listeners.length) return;
                    }
                }
                removeEventListenerFn(el, type, handler);
                delete events[type];
            });
        } else {
            /* tslint:disable:forin */
            for (type in events) {
                removeEventListenerFn(el, type, handler);
                delete events[type];
            }
            /* tslint:enable:forin */
        }
    }

    function elementRemoveData(element: Element) {
        var elementId = element.microjqid;
        var store = elementId && elementStore[elementId];

        if (store) {
            if (store.handler) {
                elementOff(element);
            }
            delete elementStore[elementId];
            element.microjqid = undefined;
        }
    }

    function subTreeRemoveData(element: Element) {
        elementRemoveData(element);
        forEach(element.querySelectorAll('*'), (descendant: Element) => {
            elementRemoveData(descendant);
        });
    }

    // MicroJQ

    function MicroEl(elements: Element[]) {
        this.length = 0;
        forEach(elements, (el: Element) => {
            this[this.length++] = el;
        });
    }

    var deepClone = (function (): (n: Node) => Node {
        function deepCloneNew(el: Node): Node {
            return el.cloneNode(true);
        }

        function deepCloneOld(el: Node): Node {
            var n = el.cloneNode(false);
            if (n.nodeType === 1 /*Node.ELEMENT_NODE*/ && el.nodeName.toLowerCase() === 'script') {
                (<HTMLScriptElement> n).text = (<HTMLScriptElement> el).text;
            } else {
                for (var c = el.firstChild; c !== null; c = c.nextSibling)
                    n.appendChild(deepCloneOld(c));
            }
            return n;
        }

        var s = document.createElement('script');
        s.text = 'x';
        return (<HTMLScriptElement> s.cloneNode(true)).text === 'x' ? deepCloneNew : deepCloneOld;
    })();

    MicroEl.prototype = {

        find: function (selector: string): MicroJQ {
            var matches = [];
            forEach(this, (el: Element) => {
                forEach(el.querySelectorAll(selector), (n: Node) => {
                    matches.push(n);
                });
            });
            return new MicroEl(matches);
        },

        contents: function (): MicroJQ {
            var matches = [];
            forEach(this, (el: Element) => {
                var child: Node = el.firstChild;
                while (child != null) {
                    matches.push(child);
                    child = child.nextSibling;
                }
            });
            return new MicroEl(matches);
        },

        clone: function (): MicroJQ {
            return new MicroEl(map(this, <(el: Element) => Element> deepClone));
        },

        first: function (): MicroJQ {
            return this.length === 0 ? this : new MicroEl([this[0]]);
        },

        data: function (key: string): any {
            return this[0].getAttribute('data-' + key);
        },

        width: function (): number {
            var br = (<HTMLElement> this[0]).getBoundingClientRect();
            return br.width !== undefined ? br.width : (br.right - br.left);
        },

        height: function (): number {
            var br = (<HTMLElement> this[0]).getBoundingClientRect();
            return br.height !== undefined ? br.height : (br.bottom - br.top);
        },

        each: function (func: (indexInArray?: number, valueOfElement?: Element) => any): MicroJQ {
            forEach(this, (el: Element, i: number) => {
                func.call(el, i, el);
            });
            return this;
        },

        append: function (...content: any[]): MicroJQ {
            var nodes: Node[] = [];
            forEach(content, (item: any) => {
                forEach(isArray(item) ? item : [item], (e: any) => {
                    if (e instanceof MicroEl) {
                        Array.prototype.push.apply(nodes, toArray(<MicroJQ> e));
                    } else {
                        nodes.push(typeof e === 'string' ? document.createTextNode(e) : e);
                    }
                });
            });
            forEach(this, (el: Element, j: number) => {
                var clone = j < this.length - 1;
                forEach(nodes, (n: Node) => {
                    el.appendChild(clone ? n.cloneNode(true) : n);
                });
            });
            return this;
        },

        toArray: function (): Element[]{
            return toArray(<Indexable<Element>> this);
        }

    };

    // element chaining

    objectEach({

        blur: (el: HTMLElement) => {
            el.blur();
        },

        focus: (el: HTMLElement) => {
            el.focus();
        },

        css: (el: HTMLElement, propertyName: string, value: string) => {
            el.style[propertyName] = value;
        },

        remove: (el: HTMLElement) => {
            subTreeRemoveData(el);
            var parent = el.parentNode;
            if (parent) parent.removeChild(el);
        },

        addClass: (el: HTMLElement, className: string) => {
            var classes = spaceSplit(el.className);
            forEach(spaceSplit(className), (newClass: string) => {
                if (indexOf(classes, newClass) < 0)
                    classes.push(newClass);
            });
            el.className = classes.join(' ');
        },

        removeClass: (el: HTMLElement, className?: string) => {
            if (className) {
                var classes = spaceSplit(el.className);
                forEach(spaceSplit(className), (removeClass: string) => {
                    arrayRemove(classes, removeClass);
                });
                el.className = classes.join(' ');
            } else
                el.className = '';
        },

        attr: (el: Element, attributeName: string, value: string) => {
            el.setAttribute(attributeName, value);
        },

        text: (el: Element, t: string) => {
            if (el.textContent !== undefined)
                el.textContent = t;
            else
                (<HTMLElement> el).innerText = t;
        },

        removeAttr: (el: Element, attributeName: string) => {
            el.removeAttribute(attributeName);
        },

        on: (el: Element, type: string, fn: MicroJQEventHandler) => {
            var store = getElementStore(el);
            var events = store.events;
            var handler = store.handler;

            if (!handler)
                handler = store.handler = createEventHandler(el, events);

            forEach(spaceSplit(type), (type: string) => {
                var eventFns = events[type];
                if (!eventFns) {
                    eventFns = events[type] = [];
                    addEventListenerFn(el, type, handler);
                }
                eventFns.push(fn);
            });
        },

        off: elementOff

    }, (name: string, method: (el: HTMLElement, arg1: any, arg2: any) => void) => {
        MicroEl.prototype[name] = function (arg1: any, arg2: any): MicroJQ {
            forEach(this, (el: HTMLElement) => {
                method(el, arg1, arg2);
            });
            return this;
        };
    });

    var microJQ = <MicroJQStatic> function (arg: any): MicroJQ {
        return new MicroEl(isArray(arg) ? arg : [arg]);
    };

    microJQ.ready = function (fn: () => void) {
        var fired = false;

        function trigger() {
            if (fired) return;
            fired = true;
            fn();
        }

        if (document.readyState === 'complete') {
            setTimeout(trigger);
        } else {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', trigger);
            }
            if (document.attachEvent) {
                document.attachEvent('onreadystatechange', (): void => {
                    if (document.readyState === 'complete')
                        trigger();
                });
            }
            addEventListenerFn(window, 'load', trigger);
        }
    };

    microJQ.forEach = forEach;
    microJQ.objectEach = objectEach;
    microJQ.map = map;
    microJQ.indexOf = indexOf;
    microJQ.trim = trim;
    //microJQ.isArray = isArray;

    window.microJQ = microJQ;

})(window, document);