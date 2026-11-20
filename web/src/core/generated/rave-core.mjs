//region block: polyfills
if (typeof Math.imul === 'undefined') {
  Math.imul = function imul(a, b) {
    return (a & 4.29490176E9) * (b & 65535) + (a & 65535) * (b | 0) | 0;
  };
}
if (typeof ArrayBuffer.isView === 'undefined') {
  ArrayBuffer.isView = function (a) {
    return a != null && a.__proto__ != null && a.__proto__.__proto__ === Int8Array.prototype.__proto__;
  };
}
if (typeof Array.prototype.fill === 'undefined') {
  // Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
  Object.defineProperty(Array.prototype, 'fill', {value: function (value) {
    // Steps 1-2.
    if (this == null) {
      throw new TypeError('this is null or not defined');
    }
    var O = Object(this); // Steps 3-5.
    var len = O.length >>> 0; // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0; // Step 8.
    var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len); // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0; // Step 11.
    var finalValue = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len); // Step 12.
    while (k < finalValue) {
      O[k] = value;
      k++;
    }
    ; // Step 13.
    return O;
  }});
}
[Int8Array, Int16Array, Uint16Array, Int32Array, Float32Array, Float64Array].forEach(function (TypedArray) {
  if (typeof TypedArray.prototype.fill === 'undefined') {
    Object.defineProperty(TypedArray.prototype, 'fill', {value: Array.prototype.fill});
  }
});
[Int8Array, Int16Array, Uint16Array, Int32Array, Float32Array, Float64Array].forEach(function (TypedArray) {
  if (typeof TypedArray.prototype.sort === 'undefined') {
    Object.defineProperty(TypedArray.prototype, 'sort', {value: function (compareFunction) {
      compareFunction = compareFunction || function (a, b) {
        if (a < b)
          return -1;
        if (a > b)
          return 1;
        if (a === b) {
          if (a !== 0)
            return 0;
          var ia = 1 / a;
          return ia === 1 / b ? 0 : ia < 0 ? -1 : 1;
        }
        return a !== a ? b !== b ? 0 : 1 : -1;
      };
      return Array.prototype.sort.call(this, compareFunction || totalOrderComparator);
    }});
  }
});
if (typeof Math.clz32 === 'undefined') {
  Math.clz32 = function (log, LN2) {
    return function (x) {
      var asUint = x >>> 0;
      if (asUint === 0) {
        return 32;
      }
      return 31 - (log(asUint) / LN2 | 0) | 0; // the "| 0" acts like math.floor
    };
  }(Math.log, Math.LN2);
}
if (typeof Math.hypot === 'undefined') {
  Math.hypot = function () {
    var y = 0;
    var length = arguments.length;
    for (var i = 0; i < length; i++) {
      if (arguments[i] === Infinity || arguments[i] === -Infinity) {
        return Infinity;
      }
      y += arguments[i] * arguments[i];
    }
    return Math.sqrt(y);
  };
}
if (typeof Math.log10 === 'undefined') {
  Math.log10 = function (x) {
    return Math.log(x) * Math.LOG10E;
  };
}
//endregion
//region block: imports
var imul_0 = Math.imul;
var isView = ArrayBuffer.isView;
var clz32 = Math.clz32;
var log10 = Math.log10;
var hypot = Math.hypot;
//endregion
//region block: pre-declaration
initMetadataForInterface(CharSequence, 'CharSequence');
initMetadataForInterface(Comparable, 'Comparable');
initMetadataForClass(Number_0, 'Number');
initMetadataForClass(asSequence$$inlined$Sequence$1);
initMetadataForClass(Char, 'Char', VOID, VOID, [Comparable]);
initMetadataForInterface(Collection, 'Collection');
initMetadataForInterface(KtSet, 'Set', VOID, VOID, [Collection]);
initMetadataForInterface(KtList, 'List', VOID, VOID, [Collection]);
initMetadataForInterface(Entry, 'Entry');
initMetadataForInterface(KtMap, 'Map');
initMetadataForCompanion(Companion);
initMetadataForClass(Enum, 'Enum', VOID, VOID, [Comparable]);
initMetadataForCompanion(Companion_0);
initMetadataForClass(Long, 'Long', VOID, Number_0, [Comparable]);
initMetadataForInterface(FunctionAdapter, 'FunctionAdapter');
initMetadataForObject(Digit, 'Digit');
initMetadataForInterface(Comparator, 'Comparator');
initMetadataForObject(Unit, 'Unit');
initMetadataForClass(AbstractCollection, 'AbstractCollection', VOID, VOID, [Collection]);
initMetadataForClass(AbstractMutableCollection, 'AbstractMutableCollection', VOID, AbstractCollection, [Collection]);
initMetadataForClass(IteratorImpl, 'IteratorImpl');
initMetadataForClass(ListIteratorImpl, 'ListIteratorImpl', VOID, IteratorImpl);
initMetadataForClass(AbstractMutableList, 'AbstractMutableList', VOID, AbstractMutableCollection, [KtList, Collection]);
initMetadataForInterface(RandomAccess, 'RandomAccess');
initMetadataForClass(SubList, 'SubList', VOID, AbstractMutableList, [RandomAccess]);
initMetadataForClass(AbstractMutableSet, 'AbstractMutableSet', VOID, AbstractMutableCollection, [Collection, KtSet]);
initMetadataForCompanion(Companion_1);
initMetadataForClass(ArrayList, 'ArrayList', ArrayList_init_$Create$, AbstractMutableList, [KtList, Collection, RandomAccess]);
initMetadataForClass(HashSet, 'HashSet', HashSet_init_$Create$, AbstractMutableSet, [Collection, KtSet]);
initMetadataForCompanion(Companion_2);
initMetadataForClass(Itr, 'Itr');
initMetadataForClass(KeysItr, 'KeysItr', VOID, Itr);
initMetadataForClass(EntriesItr, 'EntriesItr', VOID, Itr);
initMetadataForClass(EntryRef, 'EntryRef', VOID, VOID, [Entry]);
function containsAllEntries(m) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(m, Collection)) {
      tmp = m.o();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = true;
      break $l$block_0;
    }
    var _iterator__ex2g4s = m.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      // Inline function 'kotlin.js.unsafeCast' call
      // Inline function 'kotlin.js.asDynamic' call
      var entry = element;
      var tmp_0;
      if (!(entry == null) ? isInterface(entry, Entry) : false) {
        tmp_0 = this.f4(entry);
      } else {
        tmp_0 = false;
      }
      if (!tmp_0) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
}
initMetadataForInterface(InternalMap, 'InternalMap');
initMetadataForClass(InternalHashMap, 'InternalHashMap', InternalHashMap_init_$Create$, VOID, [InternalMap]);
initMetadataForClass(LinkedHashSet, 'LinkedHashSet', LinkedHashSet_init_$Create$, HashSet, [Collection, KtSet]);
initMetadataForClass(Exception, 'Exception', Exception_init_$Create$, Error);
initMetadataForClass(RuntimeException, 'RuntimeException', RuntimeException_init_$Create$, Exception);
initMetadataForClass(UnsupportedOperationException, 'UnsupportedOperationException', UnsupportedOperationException_init_$Create$, RuntimeException);
initMetadataForClass(IllegalArgumentException, 'IllegalArgumentException', IllegalArgumentException_init_$Create$, RuntimeException);
initMetadataForClass(NoSuchElementException, 'NoSuchElementException', NoSuchElementException_init_$Create$, RuntimeException);
initMetadataForClass(IndexOutOfBoundsException, 'IndexOutOfBoundsException', IndexOutOfBoundsException_init_$Create$, RuntimeException);
initMetadataForClass(IllegalStateException, 'IllegalStateException', IllegalStateException_init_$Create$, RuntimeException);
initMetadataForClass(ConcurrentModificationException, 'ConcurrentModificationException', ConcurrentModificationException_init_$Create$, RuntimeException);
initMetadataForClass(ArithmeticException, 'ArithmeticException', ArithmeticException_init_$Create$, RuntimeException);
initMetadataForClass(NoWhenBranchMatchedException, 'NoWhenBranchMatchedException', NoWhenBranchMatchedException_init_$Create$, RuntimeException);
initMetadataForClass(NullPointerException, 'NullPointerException', NullPointerException_init_$Create$, RuntimeException);
initMetadataForClass(ClassCastException, 'ClassCastException', ClassCastException_init_$Create$, RuntimeException);
initMetadataForClass(KClassImpl, 'KClassImpl');
initMetadataForClass(PrimitiveKClassImpl, 'PrimitiveKClassImpl', VOID, KClassImpl);
initMetadataForObject(NothingKClassImpl, 'NothingKClassImpl', VOID, KClassImpl);
initMetadataForClass(StringBuilder, 'StringBuilder', StringBuilder_init_$Create$_0, VOID, [CharSequence]);
initMetadataForCompanion(Companion_3);
initMetadataForClass(Regex, 'Regex');
initMetadataForClass(MatchGroup, 'MatchGroup');
initMetadataForClass(findNext$1$groups$1, VOID, VOID, AbstractCollection, [Collection]);
initMetadataForClass(AbstractList, 'AbstractList', VOID, AbstractCollection, [KtList]);
initMetadataForClass(findNext$1$groupValues$1, VOID, VOID, AbstractList);
initMetadataForClass(findNext$1);
initMetadataForClass(sam$kotlin_Comparator$0, 'sam$kotlin_Comparator$0', VOID, VOID, [Comparator, FunctionAdapter]);
initMetadataForClass(IteratorImpl_0, 'IteratorImpl');
initMetadataForClass(ListIteratorImpl_0, 'ListIteratorImpl', VOID, IteratorImpl_0);
initMetadataForCompanion(Companion_4);
initMetadataForCompanion(Companion_5);
initMetadataForObject(EmptyList, 'EmptyList', VOID, VOID, [KtList, RandomAccess]);
initMetadataForObject(EmptyIterator, 'EmptyIterator');
initMetadataForClass(IntIterator, 'IntIterator');
initMetadataForClass(TransformingSequence$iterator$1);
initMetadataForClass(TransformingSequence, 'TransformingSequence');
initMetadataForObject(EmptySet, 'EmptySet', VOID, VOID, [KtSet]);
initMetadataForObject(NaturalOrderComparator, 'NaturalOrderComparator', VOID, VOID, [Comparator]);
initMetadataForClass(EnumEntriesList, 'EnumEntriesList', VOID, AbstractList, [KtList, RandomAccess]);
initMetadataForClass(Random, 'Random');
initMetadataForObject(Default, 'Default', VOID, Random);
initMetadataForCompanion(Companion_6);
initMetadataForClass(XorWowRandom, 'XorWowRandom', VOID, Random);
initMetadataForCompanion(Companion_7);
initMetadataForClass(IntProgression, 'IntProgression');
function contains(value) {
  return compareTo(value, this.f5()) >= 0 && compareTo(value, this.f7()) < 0;
}
initMetadataForInterface(OpenEndRange, 'OpenEndRange');
initMetadataForClass(IntRange, 'IntRange', VOID, IntProgression, [OpenEndRange]);
initMetadataForClass(IntProgressionIterator, 'IntProgressionIterator', VOID, IntIterator);
initMetadataForCompanion(Companion_8);
initMetadataForClass(OpenEndFloatRange, 'OpenEndFloatRange', VOID, VOID, [OpenEndRange]);
initMetadataForClass(Pair, 'Pair');
initMetadataForObject(BuildUpModel, 'BuildUpModel');
initMetadataForClass(BeatClock, 'BeatClock', BeatClock);
initMetadataForClass(FlashBudget, 'FlashBudget', FlashBudget);
initMetadataForClass(Genre, 'Genre', VOID, Enum);
initMetadataForClass(PartyProfile, 'PartyProfile');
initMetadataForClass(GenreDetector, 'GenreDetector', GenreDetector);
initMetadataForClass(SongPart, 'SongPart', VOID, Enum);
initMetadataForClass(DropKind, 'DropKind', VOID, Enum);
initMetadataForClass(StructureHud, 'StructureHud', StructureHud);
initMetadataForObject(PartyTuning, 'PartyTuning');
initMetadataForClass(HardstyleStructure, 'HardstyleStructure', HardstyleStructure);
initMetadataForClass(HardSub, 'HardSub', VOID, Enum);
initMetadataForClass(HardSubDetector, 'HardSubDetector', HardSubDetector);
initMetadataForClass(HardstyleFrame, 'HardstyleFrame', HardstyleFrame);
initMetadataForClass(HardstyleAudio, 'HardstyleAudio', HardstyleAudio);
initMetadataForClass(BeatTracker, 'BeatTracker', BeatTracker);
initMetadataForClass(HardstyleSpectrum, 'HardstyleSpectrum', HardstyleSpectrum);
initMetadataForClass(PcmFft, 'PcmFft');
initMetadataForObject(RaveLog, 'RaveLog');
initMetadataForClass(SongListener, 'SongListener', SongListener);
initMetadataForClass(GenreLook, 'GenreLook', GenreLook);
initMetadataForObject(GenreRules, 'GenreRules');
initMetadataForClass(WebPartyEngine, 'WebPartyEngine', WebPartyEngine);
//endregion
function CharSequence() {
}
function Comparable() {
}
function Number_0() {
}
function indexOf(_this__u8e3s4, element) {
  if (element == null) {
    var inductionVariable = 0;
    var last = _this__u8e3s4.length - 1 | 0;
    if (inductionVariable <= last)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        if (_this__u8e3s4[index] == null) {
          return index;
        }
      }
       while (inductionVariable <= last);
  } else {
    var inductionVariable_0 = 0;
    var last_0 = _this__u8e3s4.length - 1 | 0;
    if (inductionVariable_0 <= last_0)
      do {
        var index_0 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + 1 | 0;
        if (equals(element, _this__u8e3s4[index_0])) {
          return index_0;
        }
      }
       while (inductionVariable_0 <= last_0);
  }
  return -1;
}
function get_lastIndex(_this__u8e3s4) {
  return _this__u8e3s4.length - 1 | 0;
}
function get_indices(_this__u8e3s4) {
  return new IntRange(0, get_lastIndex_0(_this__u8e3s4));
}
function get_indices_0(_this__u8e3s4) {
  return new IntRange(0, get_lastIndex_1(_this__u8e3s4));
}
function get_lastIndex_0(_this__u8e3s4) {
  return _this__u8e3s4.length - 1 | 0;
}
function get_lastIndex_1(_this__u8e3s4) {
  return _this__u8e3s4.length - 1 | 0;
}
function joinToString(_this__u8e3s4, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  return joinTo(_this__u8e3s4, StringBuilder_init_$Create$_0(), separator, prefix, postfix, limit, truncated, transform).toString();
}
function joinTo(_this__u8e3s4, buffer, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  buffer.e(prefix);
  var count = 0;
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  $l$loop: while (inductionVariable < last) {
    var element = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    count = count + 1 | 0;
    if (count > 1) {
      buffer.e(separator);
    }
    if (limit < 0 || count <= limit) {
      appendElement(buffer, element, transform);
    } else
      break $l$loop;
  }
  if (limit >= 0 && count > limit) {
    buffer.e(truncated);
  }
  buffer.e(postfix);
  return buffer;
}
function sorted(_this__u8e3s4) {
  // Inline function 'kotlin.apply' call
  var this_0 = toTypedArray(_this__u8e3s4);
  sort_0(this_0);
  return asList(this_0);
}
function maxOrNull(_this__u8e3s4) {
  // Inline function 'kotlin.collections.isEmpty' call
  if (_this__u8e3s4.length === 0)
    return null;
  var max = _this__u8e3s4[0];
  var inductionVariable = 1;
  var last = get_lastIndex_2(_this__u8e3s4);
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var e = _this__u8e3s4[i];
      // Inline function 'kotlin.comparisons.maxOf' call
      var a = max;
      max = Math.max(a, e);
    }
     while (!(i === last));
  return max;
}
function get_lastIndex_2(_this__u8e3s4) {
  return _this__u8e3s4.length - 1 | 0;
}
function toList(_this__u8e3s4) {
  switch (_this__u8e3s4.length) {
    case 0:
      return emptyList();
    case 1:
      return listOf(_this__u8e3s4[0]);
    default:
      return toMutableList(_this__u8e3s4);
  }
}
function getOrNull(_this__u8e3s4, index) {
  return (0 <= index ? index <= (_this__u8e3s4.length - 1 | 0) : false) ? _this__u8e3s4[index] : null;
}
function toList_0(_this__u8e3s4) {
  var tmp;
  switch (_this__u8e3s4.length) {
    case 0:
      tmp = emptyList();
      break;
    case 1:
      tmp = listOf(_this__u8e3s4[0]);
      break;
    default:
      // Inline function 'kotlin.collections.copyOf' call

      // Inline function 'kotlin.collections.copyOf' call

      // Inline function 'kotlin.js.asDynamic' call

      var tmp$ret$0 = _this__u8e3s4.slice();
      tmp = asList(tmp$ret$0);
      break;
  }
  return tmp;
}
function toMutableList(_this__u8e3s4) {
  var list = ArrayList_init_$Create$_0(_this__u8e3s4.length);
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  while (inductionVariable < last) {
    var item = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    list.i(item);
  }
  return list;
}
function toSet(_this__u8e3s4) {
  switch (_this__u8e3s4.length) {
    case 0:
      return emptySet();
    case 1:
      return setOf(_this__u8e3s4[0]);
    default:
      return toCollection(_this__u8e3s4, LinkedHashSet_init_$Create$_0(mapCapacity(_this__u8e3s4.length)));
  }
}
function toCollection(_this__u8e3s4, destination) {
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  while (inductionVariable < last) {
    var item = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    destination.i(item);
  }
  return destination;
}
function joinToString_0(_this__u8e3s4, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  return joinTo_0(_this__u8e3s4, StringBuilder_init_$Create$_0(), separator, prefix, postfix, limit, truncated, transform).toString();
}
function joinTo_0(_this__u8e3s4, buffer, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  buffer.e(prefix);
  var count = 0;
  var _iterator__ex2g4s = _this__u8e3s4.j();
  $l$loop: while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    count = count + 1 | 0;
    if (count > 1) {
      buffer.e(separator);
    }
    if (limit < 0 || count <= limit) {
      appendElement(buffer, element, transform);
    } else
      break $l$loop;
  }
  if (limit >= 0 && count > limit) {
    buffer.e(truncated);
  }
  buffer.e(postfix);
  return buffer;
}
function sorted_0(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    if (_this__u8e3s4.m() <= 1)
      return toList_1(_this__u8e3s4);
    // Inline function 'kotlin.collections.toTypedArray' call
    var tmp = copyToArray(_this__u8e3s4);
    // Inline function 'kotlin.apply' call
    var this_0 = isArray(tmp) ? tmp : THROW_CCE();
    sort_0(this_0);
    return asList(this_0);
  }
  // Inline function 'kotlin.apply' call
  var this_1 = toMutableList_0(_this__u8e3s4);
  sort_1(this_1);
  return this_1;
}
function firstOrNull(_this__u8e3s4) {
  return _this__u8e3s4.o() ? null : _this__u8e3s4.n(0);
}
function contains_0(_this__u8e3s4, element) {
  if (isInterface(_this__u8e3s4, Collection))
    return _this__u8e3s4.p(element);
  return indexOf_0(_this__u8e3s4, element) >= 0;
}
function sum(_this__u8e3s4) {
  var sum = 0;
  var _iterator__ex2g4s = _this__u8e3s4.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    sum = sum + element | 0;
  }
  return sum;
}
function takeLast(_this__u8e3s4, n) {
  // Inline function 'kotlin.require' call
  if (!(n >= 0)) {
    var message = 'Requested element count ' + n + ' is less than zero.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  if (n === 0)
    return emptyList();
  var size = _this__u8e3s4.m();
  if (n >= size)
    return toList_1(_this__u8e3s4);
  if (n === 1)
    return listOf(last(_this__u8e3s4));
  var list = ArrayList_init_$Create$_0(n);
  if (isInterface(_this__u8e3s4, RandomAccess)) {
    var inductionVariable = size - n | 0;
    if (inductionVariable < size)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        list.i(_this__u8e3s4.n(index));
      }
       while (inductionVariable < size);
  } else {
    // Inline function 'kotlin.collections.iterator' call
    var _iterator__ex2g4s = _this__u8e3s4.q(size - n | 0);
    while (_iterator__ex2g4s.k()) {
      var item = _iterator__ex2g4s.l();
      list.i(item);
    }
  }
  return list;
}
function maxOrNull_0(_this__u8e3s4) {
  var iterator = _this__u8e3s4.j();
  if (!iterator.k())
    return null;
  var max = iterator.l();
  while (iterator.k()) {
    var e = iterator.l();
    // Inline function 'kotlin.comparisons.maxOf' call
    var a = max;
    max = Math.max(a, e);
  }
  return max;
}
function toList_1(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    var tmp;
    switch (_this__u8e3s4.m()) {
      case 0:
        tmp = emptyList();
        break;
      case 1:
        var tmp_0;
        if (isInterface(_this__u8e3s4, KtList)) {
          tmp_0 = _this__u8e3s4.n(0);
        } else {
          tmp_0 = _this__u8e3s4.j().l();
        }

        tmp = listOf(tmp_0);
        break;
      default:
        tmp = toMutableList_1(_this__u8e3s4);
        break;
    }
    return tmp;
  }
  return optimizeReadOnlyList(toMutableList_0(_this__u8e3s4));
}
function toMutableList_0(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection))
    return toMutableList_1(_this__u8e3s4);
  return toCollection_0(_this__u8e3s4, ArrayList_init_$Create$());
}
function indexOf_0(_this__u8e3s4, element) {
  if (isInterface(_this__u8e3s4, KtList))
    return _this__u8e3s4.r(element);
  var index = 0;
  var _iterator__ex2g4s = _this__u8e3s4.j();
  while (_iterator__ex2g4s.k()) {
    var item = _iterator__ex2g4s.l();
    checkIndexOverflow(index);
    if (equals(element, item))
      return index;
    index = index + 1 | 0;
  }
  return -1;
}
function last(_this__u8e3s4) {
  if (_this__u8e3s4.o())
    throw NoSuchElementException_init_$Create$_0('List is empty.');
  return _this__u8e3s4.n(get_lastIndex_3(_this__u8e3s4));
}
function toMutableList_1(_this__u8e3s4) {
  return ArrayList_init_$Create$_1(_this__u8e3s4);
}
function toCollection_0(_this__u8e3s4, destination) {
  var _iterator__ex2g4s = _this__u8e3s4.j();
  while (_iterator__ex2g4s.k()) {
    var item = _iterator__ex2g4s.l();
    destination.i(item);
  }
  return destination;
}
function toSet_0(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    var tmp;
    switch (_this__u8e3s4.m()) {
      case 0:
        tmp = emptySet();
        break;
      case 1:
        var tmp_0;
        if (isInterface(_this__u8e3s4, KtList)) {
          tmp_0 = _this__u8e3s4.n(0);
        } else {
          tmp_0 = _this__u8e3s4.j().l();
        }

        tmp = setOf(tmp_0);
        break;
      default:
        tmp = toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$_0(mapCapacity(_this__u8e3s4.m())));
        break;
    }
    return tmp;
  }
  return optimizeReadOnlySet(toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$()));
}
function asSequence(_this__u8e3s4) {
  // Inline function 'kotlin.sequences.Sequence' call
  return new asSequence$$inlined$Sequence$1(_this__u8e3s4);
}
function asSequence$$inlined$Sequence$1($this_asSequence) {
  this.s_1 = $this_asSequence;
}
protoOf(asSequence$$inlined$Sequence$1).j = function () {
  return this.s_1.j();
};
function downTo(_this__u8e3s4, to) {
  return Companion_instance_8.t(_this__u8e3s4, to, -1);
}
function coerceAtMost(_this__u8e3s4, maximumValue) {
  return _this__u8e3s4 > maximumValue ? maximumValue : _this__u8e3s4;
}
function coerceAtLeast(_this__u8e3s4, minimumValue) {
  return _this__u8e3s4 < minimumValue ? minimumValue : _this__u8e3s4;
}
function coerceIn(_this__u8e3s4, minimumValue, maximumValue) {
  if (minimumValue > maximumValue)
    throw IllegalArgumentException_init_$Create$_0('Cannot coerce value to an empty range: maximum ' + maximumValue + ' is less than minimum ' + minimumValue + '.');
  if (_this__u8e3s4 < minimumValue)
    return minimumValue;
  if (_this__u8e3s4 > maximumValue)
    return maximumValue;
  return _this__u8e3s4;
}
function coerceIn_0(_this__u8e3s4, minimumValue, maximumValue) {
  if (minimumValue > maximumValue)
    throw IllegalArgumentException_init_$Create$_0('Cannot coerce value to an empty range: maximum ' + maximumValue + ' is less than minimum ' + minimumValue + '.');
  if (_this__u8e3s4 < minimumValue)
    return minimumValue;
  if (_this__u8e3s4 > maximumValue)
    return maximumValue;
  return _this__u8e3s4;
}
function coerceAtMost_0(_this__u8e3s4, maximumValue) {
  return _this__u8e3s4 > maximumValue ? maximumValue : _this__u8e3s4;
}
function coerceAtLeast_0(_this__u8e3s4, minimumValue) {
  return compare(_this__u8e3s4, minimumValue) < 0 ? minimumValue : _this__u8e3s4;
}
function coerceAtLeast_1(_this__u8e3s4, minimumValue) {
  return _this__u8e3s4 < minimumValue ? minimumValue : _this__u8e3s4;
}
function map(_this__u8e3s4, transform) {
  return new TransformingSequence(_this__u8e3s4, transform);
}
function _Char___init__impl__6a9atx(value) {
  return value;
}
function _get_value__a43j40($this) {
  return $this;
}
function Char__compareTo_impl_ypi4mb($this, other) {
  return _get_value__a43j40($this) - _get_value__a43j40(other) | 0;
}
function Char__minus_impl_a2frrh($this, other) {
  return _get_value__a43j40($this) - _get_value__a43j40(other) | 0;
}
function Char__toInt_impl_vasixd($this) {
  return _get_value__a43j40($this);
}
function toString($this) {
  // Inline function 'kotlin.js.unsafeCast' call
  return String.fromCharCode(_get_value__a43j40($this));
}
function Char() {
}
function Collection() {
}
function KtSet() {
}
function KtList() {
}
function Entry() {
}
function KtMap() {
}
function Companion() {
}
var Companion_instance;
function Companion_getInstance() {
  return Companion_instance;
}
function Enum(name, ordinal) {
  this.y_1 = name;
  this.z_1 = ordinal;
}
protoOf(Enum).a1 = function (other) {
  return compareTo(this.z_1, other.z_1);
};
protoOf(Enum).d = function (other) {
  return this.a1(other instanceof Enum ? other : THROW_CCE());
};
protoOf(Enum).equals = function (other) {
  return this === other;
};
protoOf(Enum).hashCode = function () {
  return identityHashCode(this);
};
protoOf(Enum).toString = function () {
  return this.y_1;
};
function toString_0(_this__u8e3s4) {
  var tmp1_elvis_lhs = _this__u8e3s4 == null ? null : toString_1(_this__u8e3s4);
  return tmp1_elvis_lhs == null ? 'null' : tmp1_elvis_lhs;
}
function Companion_0() {
  Companion_instance_0 = this;
  this.b1_1 = new Long(0, -2147483648);
  this.c1_1 = new Long(-1, 2147483647);
  this.d1_1 = 8;
  this.e1_1 = 64;
}
var Companion_instance_0;
function Companion_getInstance_0() {
  if (Companion_instance_0 == null)
    new Companion_0();
  return Companion_instance_0;
}
function Long(low, high) {
  Companion_getInstance_0();
  Number_0.call(this);
  this.f1_1 = low;
  this.g1_1 = high;
}
protoOf(Long).h1 = function (other) {
  return compare(this, other);
};
protoOf(Long).d = function (other) {
  return this.h1(other instanceof Long ? other : THROW_CCE());
};
protoOf(Long).toString = function () {
  return toStringImpl(this, 10);
};
protoOf(Long).equals = function (other) {
  var tmp;
  if (other instanceof Long) {
    tmp = equalsLong(this, other);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(Long).hashCode = function () {
  return hashCode(this);
};
protoOf(Long).valueOf = function () {
  return toNumber(this);
};
function abs(_this__u8e3s4) {
  var tmp;
  // Inline function 'kotlin.js.internal.isNegative' call
  if (_this__u8e3s4 < 0) {
    // Inline function 'kotlin.js.internal.unaryMinus' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = -_this__u8e3s4;
  } else {
    tmp = _this__u8e3s4;
  }
  return tmp;
}
function FunctionAdapter() {
}
function fillArrayVal(array, initValue) {
  var inductionVariable = 0;
  var last = array.length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      array[i] = initValue;
    }
     while (!(i === last));
  return array;
}
function longArray(size) {
  var tmp0 = 'LongArray';
  // Inline function 'withType' call
  var array = fillArrayVal(Array(size), new Long(0, 0));
  array.$type$ = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  return array;
}
function get_buf() {
  _init_properties_bitUtils_kt__nfcg4k();
  return buf;
}
var buf;
function get_bufFloat64() {
  _init_properties_bitUtils_kt__nfcg4k();
  return bufFloat64;
}
var bufFloat64;
var bufFloat32;
function get_bufInt32() {
  _init_properties_bitUtils_kt__nfcg4k();
  return bufInt32;
}
var bufInt32;
function get_lowIndex() {
  _init_properties_bitUtils_kt__nfcg4k();
  return lowIndex;
}
var lowIndex;
function get_highIndex() {
  _init_properties_bitUtils_kt__nfcg4k();
  return highIndex;
}
var highIndex;
function getNumberHashCode(obj) {
  _init_properties_bitUtils_kt__nfcg4k();
  // Inline function 'kotlin.js.jsBitwiseOr' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  if ((obj | 0) === obj) {
    return numberToInt(obj);
  }
  get_bufFloat64()[0] = obj;
  return imul_0(get_bufInt32()[get_highIndex()], 31) + get_bufInt32()[get_lowIndex()] | 0;
}
var properties_initialized_bitUtils_kt_i2bo3e;
function _init_properties_bitUtils_kt__nfcg4k() {
  if (!properties_initialized_bitUtils_kt_i2bo3e) {
    properties_initialized_bitUtils_kt_i2bo3e = true;
    buf = new ArrayBuffer(8);
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufFloat64 = new Float64Array(get_buf());
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufFloat32 = new Float32Array(get_buf());
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufInt32 = new Int32Array(get_buf());
    // Inline function 'kotlin.run' call
    get_bufFloat64()[0] = -1.0;
    lowIndex = !(get_bufInt32()[0] === 0) ? 1 : 0;
    highIndex = 1 - get_lowIndex() | 0;
  }
}
function get_ZERO() {
  _init_properties_boxedLong_kt__v24qrw();
  return ZERO;
}
var ZERO;
function get_ONE() {
  _init_properties_boxedLong_kt__v24qrw();
  return ONE;
}
var ONE;
function get_NEG_ONE() {
  _init_properties_boxedLong_kt__v24qrw();
  return NEG_ONE;
}
var NEG_ONE;
function get_MAX_VALUE() {
  _init_properties_boxedLong_kt__v24qrw();
  return MAX_VALUE;
}
var MAX_VALUE;
function get_MIN_VALUE() {
  _init_properties_boxedLong_kt__v24qrw();
  return MIN_VALUE;
}
var MIN_VALUE;
function get_TWO_PWR_24_() {
  _init_properties_boxedLong_kt__v24qrw();
  return TWO_PWR_24_;
}
var TWO_PWR_24_;
var longArrayClass;
function compare(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  if (equalsLong(_this__u8e3s4, other)) {
    return 0;
  }
  var thisNeg = isNegative(_this__u8e3s4);
  var otherNeg = isNegative(other);
  return thisNeg && !otherNeg ? -1 : !thisNeg && otherNeg ? 1 : isNegative(subtract(_this__u8e3s4, other)) ? -1 : 1;
}
function convertToInt(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.f1_1;
}
function toNumber(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.g1_1 * 4.294967296E9 + getLowBitsUnsigned(_this__u8e3s4);
}
function toStringImpl(_this__u8e3s4, radix) {
  _init_properties_boxedLong_kt__v24qrw();
  if (isZero(_this__u8e3s4)) {
    return '0';
  }
  if (isNegative(_this__u8e3s4)) {
    if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
      var radixLong = fromInt(radix);
      var div = divide(_this__u8e3s4, radixLong);
      var rem = convertToInt(subtract(multiply(div, radixLong), _this__u8e3s4));
      var tmp = toStringImpl(div, radix);
      // Inline function 'kotlin.js.asDynamic' call
      // Inline function 'kotlin.js.unsafeCast' call
      return tmp + rem.toString(radix);
    } else {
      return '-' + toStringImpl(negate(_this__u8e3s4), radix);
    }
  }
  var digitsPerTime = radix === 2 ? 31 : radix <= 10 ? 9 : radix <= 21 ? 7 : radix <= 35 ? 6 : 5;
  var radixToPower = fromNumber(Math.pow(radix, digitsPerTime));
  var rem_0 = _this__u8e3s4;
  var result = '';
  while (true) {
    var remDiv = divide(rem_0, radixToPower);
    var intval = convertToInt(subtract(rem_0, multiply(remDiv, radixToPower)));
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var digits = intval.toString(radix);
    rem_0 = remDiv;
    if (isZero(rem_0)) {
      return digits + result;
    } else {
      while (digits.length < digitsPerTime) {
        digits = '0' + digits;
      }
      result = digits + result;
    }
  }
}
function equalsLong(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.g1_1 === other.g1_1 && _this__u8e3s4.f1_1 === other.f1_1;
}
function hashCode(l) {
  _init_properties_boxedLong_kt__v24qrw();
  return l.f1_1 ^ l.g1_1;
}
function fromInt(value) {
  _init_properties_boxedLong_kt__v24qrw();
  return new Long(value, value < 0 ? -1 : 0);
}
function isNegative(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.g1_1 < 0;
}
function subtract(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return add(_this__u8e3s4, negate(other));
}
function getLowBitsUnsigned(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.f1_1 >= 0 ? _this__u8e3s4.f1_1 : 4.294967296E9 + _this__u8e3s4.f1_1;
}
function isZero(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.g1_1 === 0 && _this__u8e3s4.f1_1 === 0;
}
function multiply(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  if (isZero(_this__u8e3s4)) {
    return get_ZERO();
  } else if (isZero(other)) {
    return get_ZERO();
  }
  if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
    return isOdd(other) ? get_MIN_VALUE() : get_ZERO();
  } else if (equalsLong(other, get_MIN_VALUE())) {
    return isOdd(_this__u8e3s4) ? get_MIN_VALUE() : get_ZERO();
  }
  if (isNegative(_this__u8e3s4)) {
    var tmp;
    if (isNegative(other)) {
      tmp = multiply(negate(_this__u8e3s4), negate(other));
    } else {
      tmp = negate(multiply(negate(_this__u8e3s4), other));
    }
    return tmp;
  } else if (isNegative(other)) {
    return negate(multiply(_this__u8e3s4, negate(other)));
  }
  if (lessThan(_this__u8e3s4, get_TWO_PWR_24_()) && lessThan(other, get_TWO_PWR_24_())) {
    return fromNumber(toNumber(_this__u8e3s4) * toNumber(other));
  }
  var a48 = _this__u8e3s4.g1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.g1_1 & 65535;
  var a16 = _this__u8e3s4.f1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.f1_1 & 65535;
  var b48 = other.g1_1 >>> 16 | 0;
  var b32 = other.g1_1 & 65535;
  var b16 = other.f1_1 >>> 16 | 0;
  var b00 = other.f1_1 & 65535;
  var c48 = 0;
  var c32 = 0;
  var c16 = 0;
  var c00 = 0;
  c00 = c00 + imul_0(a00, b00) | 0;
  c16 = c16 + (c00 >>> 16 | 0) | 0;
  c00 = c00 & 65535;
  c16 = c16 + imul_0(a16, b00) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c16 = c16 + imul_0(a00, b16) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c32 = c32 + imul_0(a32, b00) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c32 = c32 + imul_0(a16, b16) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c32 = c32 + imul_0(a00, b32) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c48 = c48 + (((imul_0(a48, b00) + imul_0(a32, b16) | 0) + imul_0(a16, b32) | 0) + imul_0(a00, b48) | 0) | 0;
  c48 = c48 & 65535;
  return new Long(c16 << 16 | c00, c48 << 16 | c32);
}
function negate(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return add(invert(_this__u8e3s4), new Long(1, 0));
}
function fromNumber(value) {
  _init_properties_boxedLong_kt__v24qrw();
  if (isNaN_0(value)) {
    return get_ZERO();
  } else if (value <= -9.223372036854776E18) {
    return get_MIN_VALUE();
  } else if (value + 1 >= 9.223372036854776E18) {
    return get_MAX_VALUE();
  } else if (value < 0) {
    return negate(fromNumber(-value));
  } else {
    var twoPwr32 = 4.294967296E9;
    // Inline function 'kotlin.js.jsBitwiseOr' call
    var tmp = value % twoPwr32 | 0;
    // Inline function 'kotlin.js.jsBitwiseOr' call
    var tmp$ret$1 = value / twoPwr32 | 0;
    return new Long(tmp, tmp$ret$1);
  }
}
function add(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  var a48 = _this__u8e3s4.g1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.g1_1 & 65535;
  var a16 = _this__u8e3s4.f1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.f1_1 & 65535;
  var b48 = other.g1_1 >>> 16 | 0;
  var b32 = other.g1_1 & 65535;
  var b16 = other.f1_1 >>> 16 | 0;
  var b00 = other.f1_1 & 65535;
  var c48 = 0;
  var c32 = 0;
  var c16 = 0;
  var c00 = 0;
  c00 = c00 + (a00 + b00 | 0) | 0;
  c16 = c16 + (c00 >>> 16 | 0) | 0;
  c00 = c00 & 65535;
  c16 = c16 + (a16 + b16 | 0) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c32 = c32 + (a32 + b32 | 0) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c48 = c48 + (a48 + b48 | 0) | 0;
  c48 = c48 & 65535;
  return new Long(c16 << 16 | c00, c48 << 16 | c32);
}
function isOdd(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return (_this__u8e3s4.f1_1 & 1) === 1;
}
function lessThan(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return compare(_this__u8e3s4, other) < 0;
}
function invert(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return new Long(~_this__u8e3s4.f1_1, ~_this__u8e3s4.g1_1);
}
function divide(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  if (isZero(other)) {
    throw Exception_init_$Create$_0('division by zero');
  } else if (isZero(_this__u8e3s4)) {
    return get_ZERO();
  }
  if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
    if (equalsLong(other, get_ONE()) || equalsLong(other, get_NEG_ONE())) {
      return get_MIN_VALUE();
    } else if (equalsLong(other, get_MIN_VALUE())) {
      return get_ONE();
    } else {
      var halfThis = shiftRight(_this__u8e3s4, 1);
      var approx = shiftLeft(divide(halfThis, other), 1);
      if (equalsLong(approx, get_ZERO())) {
        return isNegative(other) ? get_ONE() : get_NEG_ONE();
      } else {
        var rem = subtract(_this__u8e3s4, multiply(other, approx));
        return add(approx, divide(rem, other));
      }
    }
  } else if (equalsLong(other, get_MIN_VALUE())) {
    return get_ZERO();
  }
  if (isNegative(_this__u8e3s4)) {
    var tmp;
    if (isNegative(other)) {
      tmp = divide(negate(_this__u8e3s4), negate(other));
    } else {
      tmp = negate(divide(negate(_this__u8e3s4), other));
    }
    return tmp;
  } else if (isNegative(other)) {
    return negate(divide(_this__u8e3s4, negate(other)));
  }
  var res = get_ZERO();
  var rem_0 = _this__u8e3s4;
  while (greaterThanOrEqual(rem_0, other)) {
    var approxDouble = toNumber(rem_0) / toNumber(other);
    var approx2 = Math.max(1.0, Math.floor(approxDouble));
    var log2 = Math.ceil(Math.log(approx2) / Math.LN2);
    var delta = log2 <= 48 ? 1.0 : Math.pow(2.0, log2 - 48);
    var approxRes = fromNumber(approx2);
    var approxRem = multiply(approxRes, other);
    while (isNegative(approxRem) || greaterThan(approxRem, rem_0)) {
      approx2 = approx2 - delta;
      approxRes = fromNumber(approx2);
      approxRem = multiply(approxRes, other);
    }
    if (isZero(approxRes)) {
      approxRes = get_ONE();
    }
    res = add(res, approxRes);
    rem_0 = subtract(rem_0, approxRem);
  }
  return res;
}
function shiftRight(_this__u8e3s4, numBits) {
  _init_properties_boxedLong_kt__v24qrw();
  var numBits_0 = numBits & 63;
  if (numBits_0 === 0) {
    return _this__u8e3s4;
  } else {
    if (numBits_0 < 32) {
      return new Long(_this__u8e3s4.f1_1 >>> numBits_0 | 0 | _this__u8e3s4.g1_1 << (32 - numBits_0 | 0), _this__u8e3s4.g1_1 >> numBits_0);
    } else {
      return new Long(_this__u8e3s4.g1_1 >> (numBits_0 - 32 | 0), _this__u8e3s4.g1_1 >= 0 ? 0 : -1);
    }
  }
}
function shiftLeft(_this__u8e3s4, numBits) {
  _init_properties_boxedLong_kt__v24qrw();
  var numBits_0 = numBits & 63;
  if (numBits_0 === 0) {
    return _this__u8e3s4;
  } else {
    if (numBits_0 < 32) {
      return new Long(_this__u8e3s4.f1_1 << numBits_0, _this__u8e3s4.g1_1 << numBits_0 | (_this__u8e3s4.f1_1 >>> (32 - numBits_0 | 0) | 0));
    } else {
      return new Long(0, _this__u8e3s4.f1_1 << (numBits_0 - 32 | 0));
    }
  }
}
function greaterThan(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return compare(_this__u8e3s4, other) > 0;
}
function greaterThanOrEqual(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return compare(_this__u8e3s4, other) >= 0;
}
function modulo(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return subtract(_this__u8e3s4, multiply(divide(_this__u8e3s4, other), other));
}
function numberToLong(a) {
  _init_properties_boxedLong_kt__v24qrw();
  var tmp;
  if (a instanceof Long) {
    tmp = a;
  } else {
    tmp = fromNumber(a);
  }
  return tmp;
}
function isLongArray(a) {
  _init_properties_boxedLong_kt__v24qrw();
  return isJsArray(a) && a.$type$ === 'LongArray';
}
function longArrayClass$lambda(it) {
  _init_properties_boxedLong_kt__v24qrw();
  return !(it == null) ? isLongArray(it) : false;
}
var properties_initialized_boxedLong_kt_lfwt2;
function _init_properties_boxedLong_kt__v24qrw() {
  if (!properties_initialized_boxedLong_kt_lfwt2) {
    properties_initialized_boxedLong_kt_lfwt2 = true;
    ZERO = fromInt(0);
    ONE = fromInt(1);
    NEG_ONE = fromInt(-1);
    MAX_VALUE = new Long(-1, 2147483647);
    MIN_VALUE = new Long(0, -2147483648);
    TWO_PWR_24_ = fromInt(16777216);
    // Inline function 'kotlin.js.unsafeCast' call
    var tmp = Array;
    longArrayClass = new PrimitiveKClassImpl(tmp, 'LongArray', longArrayClass$lambda);
  }
}
function charSequenceGet(a, index) {
  var tmp;
  if (isString(a)) {
    tmp = charCodeAt(a, index);
  } else {
    tmp = a.b(index);
  }
  return tmp;
}
function isString(a) {
  return typeof a === 'string';
}
function charCodeAt(_this__u8e3s4, index) {
  // Inline function 'kotlin.js.asDynamic' call
  return _this__u8e3s4.charCodeAt(index);
}
function charSequenceLength(a) {
  var tmp;
  if (isString(a)) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = a.length;
  } else {
    tmp = a.a();
  }
  return tmp;
}
function charSequenceSubSequence(a, startIndex, endIndex) {
  var tmp;
  if (isString(a)) {
    tmp = substring(a, startIndex, endIndex);
  } else {
    tmp = a.c(startIndex, endIndex);
  }
  return tmp;
}
function arrayToString(array) {
  return joinToString(array, ', ', '[', ']', VOID, VOID, arrayToString$lambda);
}
function contentEqualsInternal(_this__u8e3s4, other) {
  // Inline function 'kotlin.js.asDynamic' call
  var a = _this__u8e3s4;
  // Inline function 'kotlin.js.asDynamic' call
  var b = other;
  if (a === b)
    return true;
  if (a == null || b == null || !isArrayish(b) || a.length != b.length)
    return false;
  var inductionVariable = 0;
  var last = a.length;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (!equals(a[i], b[i])) {
        return false;
      }
    }
     while (inductionVariable < last);
  return true;
}
function contentHashCodeInternal(_this__u8e3s4) {
  // Inline function 'kotlin.js.asDynamic' call
  var a = _this__u8e3s4;
  if (a == null)
    return 0;
  var result = 1;
  var inductionVariable = 0;
  var last = a.length;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      result = imul_0(result, 31) + hashCode_0(a[i]) | 0;
    }
     while (inductionVariable < last);
  return result;
}
function arrayToString$lambda(it) {
  return toString_1(it);
}
function compareTo(a, b) {
  var tmp;
  switch (typeof a) {
    case 'number':
      var tmp_0;
      if (typeof b === 'number') {
        tmp_0 = doubleCompareTo(a, b);
      } else {
        if (b instanceof Long) {
          tmp_0 = doubleCompareTo(a, toNumber(b));
        } else {
          tmp_0 = primitiveCompareTo(a, b);
        }
      }

      tmp = tmp_0;
      break;
    case 'string':
    case 'boolean':
    case 'bigint':
      tmp = primitiveCompareTo(a, b);
      break;
    default:
      tmp = compareToDoNotIntrinsicify(a, b);
      break;
  }
  return tmp;
}
function doubleCompareTo(a, b) {
  var tmp;
  if (a < b) {
    tmp = -1;
  } else if (a > b) {
    tmp = 1;
  } else if (a === b) {
    var tmp_0;
    if (a !== 0) {
      tmp_0 = 0;
    } else {
      // Inline function 'kotlin.js.asDynamic' call
      var ia = 1 / a;
      var tmp_1;
      // Inline function 'kotlin.js.asDynamic' call
      if (ia === 1 / b) {
        tmp_1 = 0;
      } else {
        if (ia < 0) {
          tmp_1 = -1;
        } else {
          tmp_1 = 1;
        }
      }
      tmp_0 = tmp_1;
    }
    tmp = tmp_0;
  } else if (a !== a) {
    tmp = b !== b ? 0 : 1;
  } else {
    tmp = -1;
  }
  return tmp;
}
function primitiveCompareTo(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function compareToDoNotIntrinsicify(a, b) {
  return a.d(b);
}
function identityHashCode(obj) {
  return getObjectHashCode(obj);
}
function objectCreate(proto) {
  proto = proto === VOID ? null : proto;
  return Object.create(proto);
}
function defineProp(obj, name, getter, setter, enumerable) {
  return Object.defineProperty(obj, name, {configurable: true, get: getter, set: setter, enumerable: enumerable});
}
function getObjectHashCode(obj) {
  // Inline function 'kotlin.js.jsIn' call
  if (!('kotlinHashCodeValue$' in obj)) {
    var hash = calculateRandomHash();
    var descriptor = new Object();
    descriptor.value = hash;
    descriptor.enumerable = false;
    Object.defineProperty(obj, 'kotlinHashCodeValue$', descriptor);
  }
  // Inline function 'kotlin.js.unsafeCast' call
  return obj['kotlinHashCodeValue$'];
}
function calculateRandomHash() {
  // Inline function 'kotlin.js.jsBitwiseOr' call
  return Math.random() * 4.294967296E9 | 0;
}
function toString_1(o) {
  var tmp;
  if (o == null) {
    tmp = 'null';
  } else if (isArrayish(o)) {
    tmp = '[...]';
  } else if (!(typeof o.toString === 'function')) {
    tmp = anyToString(o);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = o.toString();
  }
  return tmp;
}
function anyToString(o) {
  return Object.prototype.toString.call(o);
}
function equals(obj1, obj2) {
  if (obj1 == null) {
    return obj2 == null;
  }
  if (obj2 == null) {
    return false;
  }
  if (typeof obj1 === 'object' && typeof obj1.equals === 'function') {
    return obj1.equals(obj2);
  }
  if (obj1 !== obj1) {
    return obj2 !== obj2;
  }
  if (typeof obj1 === 'number' && typeof obj2 === 'number') {
    var tmp;
    if (obj1 === obj2) {
      var tmp_0;
      if (obj1 !== 0) {
        tmp_0 = true;
      } else {
        // Inline function 'kotlin.js.asDynamic' call
        var tmp_1 = 1 / obj1;
        // Inline function 'kotlin.js.asDynamic' call
        tmp_0 = tmp_1 === 1 / obj2;
      }
      tmp = tmp_0;
    } else {
      tmp = false;
    }
    return tmp;
  }
  if (isCallableReference(obj1) && isCallableReference(obj2)) {
    if (obj1 === obj2)
      return true;
    if (obj1.$id != obj2.$id)
      return false;
    if (obj1.$flags != obj2.$flags)
      return false;
    if (obj1.$arity != obj2.$arity)
      return false;
    if (obj1.$bound == null && obj2.$bound == null)
      return true;
    if (obj1.$bound === obj2.$bound)
      return true;
    if (!isJsArray(obj1.$bound) || !isJsArray(obj2.$bound))
      return false;
    // Inline function 'kotlin.js.unsafeCast' call
    var bound1 = obj1.$bound;
    // Inline function 'kotlin.js.unsafeCast' call
    var bound2 = obj2.$bound;
    return contentEqualsInternal(bound1, bound2);
  }
  return obj1 === obj2;
}
function hashCode_0(obj) {
  if (obj == null)
    return 0;
  var typeOf = typeof obj;
  var tmp;
  switch (typeOf) {
    case 'object':
      tmp = 'function' === typeof obj.hashCode ? obj.hashCode() : getObjectHashCode(obj);
      break;
    case 'function':
      tmp = isCallableReference(obj) ? getCallableReferenceHashCode(obj) : getObjectHashCode(obj);
      break;
    case 'number':
      tmp = getNumberHashCode(obj);
      break;
    case 'boolean':
      // Inline function 'kotlin.js.unsafeCast' call

      tmp = getBooleanHashCode(obj);
      break;
    case 'string':
      tmp = getStringHashCode(String(obj));
      break;
    case 'bigint':
      // Inline function 'kotlin.js.unsafeCast' call

      tmp = getBigIntHashCode(obj);
      break;
    case 'symbol':
      tmp = getSymbolHashCode(obj);
      break;
    default:
      tmp = function () {
        throw new Error('Unexpected typeof `' + typeOf + '`');
      }();
      break;
  }
  return tmp;
}
function getCallableReferenceHashCode(obj) {
  // Inline function 'kotlin.js.unsafeCast' call
  var hash = obj.$flags;
  hash = imul_0(31, hash) + hashCode_0(obj.$id) | 0;
  var tmp = imul_0(31, hash);
  var tmp0_elvis_lhs = obj.$arity;
  // Inline function 'kotlin.js.unsafeCast' call
  hash = tmp + (tmp0_elvis_lhs == null ? -1 : tmp0_elvis_lhs) | 0;
  var bound = obj.$bound;
  if (bound != null && isJsArray(bound)) {
    // Inline function 'kotlin.js.unsafeCast' call
    var boundArray = bound;
    hash = imul_0(31, hash) + contentHashCodeInternal(boundArray) | 0;
  }
  return hash;
}
function getBooleanHashCode(value) {
  return value ? 1231 : 1237;
}
function getStringHashCode(str) {
  var hash = 0;
  var length = str.length;
  var inductionVariable = 0;
  var last = length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      // Inline function 'kotlin.js.asDynamic' call
      var code = str.charCodeAt(i);
      hash = imul_0(hash, 31) + code | 0;
    }
     while (!(i === last));
  return hash;
}
function getBigIntHashCode(value) {
  var shiftNumber = BigInt(32);
  var mask = BigInt(4.294967295E9);
  var bigNumber = abs(value);
  var hashCode = 0;
  var tmp;
  // Inline function 'kotlin.js.internal.isNegative' call
  if (value < 0) {
    tmp = -1;
  } else {
    tmp = 1;
  }
  var signum = tmp;
  $l$loop: while (true) {
    // Inline function 'kotlin.js.internal.isZero' call
    if (!!(bigNumber == 0)) {
      break $l$loop;
    }
    // Inline function 'kotlin.js.internal.and' call
    // Inline function 'kotlin.js.jsBitwiseAnd' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.internal.toNumber' call
    var self_0 = bigNumber & mask;
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    var chunk = Number(self_0);
    hashCode = imul_0(31, hashCode) + chunk | 0;
    // Inline function 'kotlin.js.internal.shr' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bigNumber = bigNumber >> shiftNumber;
  }
  return imul_0(hashCode, signum);
}
function getSymbolHashCode(value) {
  var hashCodeMap = symbolIsSharable(value) ? getSymbolMap() : getSymbolWeakMap();
  var cachedHashCode = hashCodeMap.get(value);
  if (cachedHashCode !== VOID)
    return cachedHashCode;
  var hash = calculateRandomHash();
  hashCodeMap.set(value, hash);
  return hash;
}
function symbolIsSharable(symbol) {
  return Symbol.keyFor(symbol) != VOID;
}
function getSymbolMap() {
  if (symbolMap === VOID) {
    symbolMap = new Map();
  }
  return symbolMap;
}
function getSymbolWeakMap() {
  if (symbolWeakMap === VOID) {
    symbolWeakMap = new WeakMap();
  }
  return symbolWeakMap;
}
var symbolMap;
var symbolWeakMap;
function unboxIntrinsic(x) {
  // Inline function 'kotlin.error' call
  var message = 'Should be lowered';
  throw IllegalStateException_init_$Create$_0(toString_1(message));
}
function captureStack(instance, constructorFunction) {
  if (Error.captureStackTrace != null) {
    Error.captureStackTrace(instance, constructorFunction);
  } else {
    // Inline function 'kotlin.js.asDynamic' call
    instance.stack = (new Error()).stack;
  }
}
function protoOf(constructor) {
  return constructor.prototype;
}
function defineMessage(message, cause) {
  var tmp;
  if (isUndefined(message)) {
    var tmp_0;
    if (isUndefined(cause)) {
      tmp_0 = message;
    } else {
      var tmp1_elvis_lhs = cause == null ? null : cause.toString();
      tmp_0 = tmp1_elvis_lhs == null ? VOID : tmp1_elvis_lhs;
    }
    tmp = tmp_0;
  } else {
    tmp = message == null ? VOID : message;
  }
  return tmp;
}
function isUndefined(value) {
  return value === VOID;
}
function extendThrowable(this_, message, cause) {
  defineFieldOnInstance(this_, 'message', defineMessage(message, cause));
  defineFieldOnInstance(this_, 'cause', cause);
  defineFieldOnInstance(this_, 'name', Object.getPrototypeOf(this_).constructor.name);
}
function defineFieldOnInstance(this_, name, value) {
  Object.defineProperty(this_, name, {configurable: true, writable: true, value: value});
}
function noWhenBranchMatchedException() {
  throw NoWhenBranchMatchedException_init_$Create$();
}
function THROW_NPE() {
  throw NullPointerException_init_$Create$();
}
function THROW_CCE() {
  throw ClassCastException_init_$Create$();
}
function ensureNotNull(v) {
  var tmp;
  if (v == null) {
    THROW_NPE();
  } else {
    tmp = v;
  }
  return tmp;
}
function jsGenerateInterfaceSymbol() {
  return generateInterfaceSymbolById();
}
function createMetadata(kind, name, defaultConstructor, associatedObjectKey, associatedObjects, suspendArity) {
  var undef = VOID;
  return {kind: kind, simpleName: name, associatedObjectKey: associatedObjectKey, associatedObjects: associatedObjects, suspendArity: suspendArity, $kClass$: undef, defaultConstructor: defaultConstructor};
}
function initMetadataForClass(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'class';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  if (!(parent == null)) {
    ctor.prototype = Object.create(parent.prototype);
    ctor.prototype.constructor = ctor;
  }
  var metadata = createMetadata(kind, name, defaultConstructor, associatedObjectKey, associatedObjects, suspendArity);
  ctor.$metadata$ = metadata;
  var prototype = ctor.prototype;
  if (!(interfaces == null)) {
    var inductionVariable = 0;
    var last = interfaces.length;
    while (inductionVariable < last) {
      var i = interfaces[inductionVariable];
      inductionVariable = inductionVariable + 1 | 0;
      Object.assign(prototype, i.prototype);
      prototype[i.Symbol] = true;
    }
  }
  if (kind === 'interface') {
    ctor.Symbol = generateInterfaceSymbolById();
  }
}
function generateInterfaceSymbolById() {
  return '#__interface_' + generateInterfaceId();
}
function generateInterfaceId() {
  if (globalInterfaceId === VOID) {
    globalInterfaceId = 0;
  }
  // Inline function 'kotlin.js.unsafeCast' call
  globalInterfaceId = globalInterfaceId + 1 | 0;
  return globalInterfaceId;
}
var globalInterfaceId;
function initMetadataForObject(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'object';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataForInterface(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'interface';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataForLambda(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'Lambda', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForCoroutine(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'Coroutine', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForFunctionReference(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'FunctionReference', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForCompanion(ctor, parent, interfaces, suspendArity) {
  initMetadataForObject(ctor, 'Companion', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function toByte(a) {
  // Inline function 'kotlin.js.unsafeCast' call
  return a << 24 >> 24;
}
function numberToInt(a) {
  var tmp;
  if (a instanceof Long) {
    tmp = convertToInt(a);
  } else {
    tmp = doubleToInt(a);
  }
  return tmp;
}
function doubleToInt(a) {
  var tmp;
  if (a > 2147483647) {
    tmp = 2147483647;
  } else if (a < -2147483648) {
    tmp = -2147483648;
  } else {
    // Inline function 'kotlin.js.jsBitwiseOr' call
    tmp = a | 0;
  }
  return tmp;
}
function numberToDouble(a) {
  // Inline function 'kotlin.js.unsafeCast' call
  return Number(a);
}
function numberRangeToNumber(start, endInclusive) {
  return new IntRange(start, endInclusive);
}
function isArrayish(o) {
  return isJsArray(o) || isView(o);
}
function isJsArray(obj) {
  // Inline function 'kotlin.js.unsafeCast' call
  return Array.isArray(obj);
}
function isCallableReference(value) {
  return typeof value === 'function' && value.$flags != null && value.$arity != null;
}
function isInterface(obj, iface) {
  return obj[iface.Symbol] === true;
}
function isArray(obj) {
  var tmp;
  if (isJsArray(obj)) {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = !obj.$type$;
  } else {
    tmp = false;
  }
  return tmp;
}
function isNumber(a) {
  var tmp;
  if (typeof a === 'number') {
    tmp = true;
  } else {
    tmp = a instanceof Long;
  }
  return tmp;
}
function isComparable(value) {
  var type = typeof value;
  return type === 'string' || type === 'boolean' || isNumber(value) || isInterface(value, Comparable);
}
function isCharSequence(value) {
  return typeof value === 'string' || isInterface(value, CharSequence);
}
function get_VOID() {
  _init_properties_void_kt__3zg9as();
  return VOID;
}
var VOID;
var properties_initialized_void_kt_e4ret2;
function _init_properties_void_kt__3zg9as() {
  if (!properties_initialized_void_kt_e4ret2) {
    properties_initialized_void_kt_e4ret2 = true;
    VOID = void 0;
  }
}
function fill(_this__u8e3s4, element, fromIndex, toIndex) {
  fromIndex = fromIndex === VOID ? 0 : fromIndex;
  toIndex = toIndex === VOID ? _this__u8e3s4.length : toIndex;
  Companion_instance_4.k1(fromIndex, toIndex, _this__u8e3s4.length);
  // Inline function 'kotlin.js.nativeFill' call
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.fill(element, fromIndex, toIndex);
}
function copyOf(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.require' call
  if (!(newSize >= 0)) {
    var message = 'Invalid new array size: ' + newSize + '.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  var size = _this__u8e3s4.length;
  var tmp;
  if (newSize < 16 || size < 16) {
    tmp = fillFrom(_this__u8e3s4, new Int32Array(newSize));
  } else if (newSize > size) {
    // Inline function 'kotlin.also' call
    var this_0 = new Int32Array(newSize);
    // Inline function 'kotlin.js.asDynamic' call
    this_0.set(_this__u8e3s4);
    tmp = this_0;
  } else {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = _this__u8e3s4.slice(0, newSize);
  }
  return tmp;
}
function copyOf_0(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.require' call
  if (!(newSize >= 0)) {
    var message = 'Invalid new array size: ' + newSize + '.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return arrayCopyResize(_this__u8e3s4, newSize, null);
}
function fill_0(_this__u8e3s4, element, fromIndex, toIndex) {
  fromIndex = fromIndex === VOID ? 0 : fromIndex;
  toIndex = toIndex === VOID ? _this__u8e3s4.length : toIndex;
  Companion_instance_4.k1(fromIndex, toIndex, _this__u8e3s4.length);
  // Inline function 'kotlin.js.nativeFill' call
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.fill(element, fromIndex, toIndex);
}
function copyOf_1(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.require' call
  if (!(newSize >= 0)) {
    var message = 'Invalid new array size: ' + newSize + '.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  var size = _this__u8e3s4.length;
  var tmp;
  if (newSize < 16 || size < 16) {
    tmp = fillFrom(_this__u8e3s4, new Float32Array(newSize));
  } else if (newSize > size) {
    // Inline function 'kotlin.also' call
    var this_0 = new Float32Array(newSize);
    // Inline function 'kotlin.js.asDynamic' call
    this_0.set(_this__u8e3s4);
    tmp = this_0;
  } else {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = _this__u8e3s4.slice(0, newSize);
  }
  return tmp;
}
function sort(_this__u8e3s4) {
  // Inline function 'kotlin.js.nativeSort' call
  var comparison = undefined;
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.sort(comparison);
}
function asList(_this__u8e3s4) {
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return new ArrayList(_this__u8e3s4);
}
function toTypedArray(_this__u8e3s4) {
  return [].slice.call(_this__u8e3s4);
}
function sort_0(_this__u8e3s4) {
  if (_this__u8e3s4.length > 1) {
    sortArray(_this__u8e3s4);
  }
}
function maxOf(a, other) {
  var max = a;
  var inductionVariable = 0;
  var last = other.length;
  while (inductionVariable < last) {
    var e = other[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    // Inline function 'kotlin.comparisons.maxOf' call
    var a_0 = max;
    max = Math.max(a_0, e);
  }
  return max;
}
function digitToIntImpl(_this__u8e3s4) {
  // Inline function 'kotlin.code' call
  var ch = Char__toInt_impl_vasixd(_this__u8e3s4);
  var index = binarySearchRange(Digit_getInstance().l1_1, ch);
  var diff = ch - Digit_getInstance().l1_1[index] | 0;
  return diff < 10 ? diff : -1;
}
function binarySearchRange(array, needle) {
  var bottom = 0;
  var top = array.length - 1 | 0;
  var middle = -1;
  var value = 0;
  while (bottom <= top) {
    middle = (bottom + top | 0) / 2 | 0;
    value = array[middle];
    if (needle > value)
      bottom = middle + 1 | 0;
    else if (needle === value)
      return middle;
    else
      top = middle - 1 | 0;
  }
  return middle - (needle < value ? 1 : 0) | 0;
}
function Digit() {
  Digit_instance = this;
  var tmp = this;
  // Inline function 'kotlin.intArrayOf' call
  tmp.l1_1 = new Int32Array([48, 1632, 1776, 1984, 2406, 2534, 2662, 2790, 2918, 3046, 3174, 3302, 3430, 3558, 3664, 3792, 3872, 4160, 4240, 6112, 6160, 6470, 6608, 6784, 6800, 6992, 7088, 7232, 7248, 42528, 43216, 43264, 43472, 43504, 43600, 44016, 65296]);
}
var Digit_instance;
function Digit_getInstance() {
  if (Digit_instance == null)
    new Digit();
  return Digit_instance;
}
function isWhitespaceImpl(_this__u8e3s4) {
  // Inline function 'kotlin.code' call
  var ch = Char__toInt_impl_vasixd(_this__u8e3s4);
  return (9 <= ch ? ch <= 13 : false) || (28 <= ch ? ch <= 32 : false) || ch === 160 || (ch > 4096 && (ch === 5760 || (8192 <= ch ? ch <= 8202 : false) || ch === 8232 || ch === 8233 || ch === 8239 || ch === 8287 || ch === 12288));
}
function Comparator() {
}
function isNaN_0(_this__u8e3s4) {
  return !(_this__u8e3s4 === _this__u8e3s4);
}
function takeHighestOneBit(_this__u8e3s4) {
  var tmp;
  if (_this__u8e3s4 === 0) {
    tmp = 0;
  } else {
    // Inline function 'kotlin.countLeadingZeroBits' call
    tmp = 1 << (31 - clz32(_this__u8e3s4) | 0);
  }
  return tmp;
}
function Unit() {
}
protoOf(Unit).toString = function () {
  return 'kotlin.Unit';
};
var Unit_instance;
function Unit_getInstance() {
  return Unit_instance;
}
function copyToArray(collection) {
  var tmp;
  // Inline function 'kotlin.js.asDynamic' call
  if (collection.toArray !== undefined) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = collection.toArray();
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = collectionToArray(collection);
  }
  return tmp;
}
function checkIndexOverflow(index) {
  if (index < 0) {
    throwIndexOverflow();
  }
  return index;
}
function arrayCopy(source, destination, destinationOffset, startIndex, endIndex) {
  Companion_instance_4.k1(startIndex, endIndex, source.length);
  var rangeSize = endIndex - startIndex | 0;
  Companion_instance_4.k1(destinationOffset, destinationOffset + rangeSize | 0, destination.length);
  if (isView(destination) && isView(source)) {
    // Inline function 'kotlin.js.asDynamic' call
    var subrange = source.subarray(startIndex, endIndex);
    // Inline function 'kotlin.js.asDynamic' call
    destination.set(subrange, destinationOffset);
  } else {
    if (!(source === destination) || destinationOffset <= startIndex) {
      var inductionVariable = 0;
      if (inductionVariable < rangeSize)
        do {
          var index = inductionVariable;
          inductionVariable = inductionVariable + 1 | 0;
          destination[destinationOffset + index | 0] = source[startIndex + index | 0];
        }
         while (inductionVariable < rangeSize);
    } else {
      var inductionVariable_0 = rangeSize - 1 | 0;
      if (0 <= inductionVariable_0)
        do {
          var index_0 = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + -1 | 0;
          destination[destinationOffset + index_0 | 0] = source[startIndex + index_0 | 0];
        }
         while (0 <= inductionVariable_0);
    }
  }
}
function collectionToArray(collection) {
  return collectionToArrayCommonImpl(collection);
}
function listOf(element) {
  // Inline function 'kotlin.arrayOf' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp$ret$0 = [element];
  return new ArrayList(tmp$ret$0);
}
function sort_1(_this__u8e3s4) {
  collectionsSort(_this__u8e3s4, naturalOrder());
}
function setOf(element) {
  return hashSetOf([element]);
}
function collectionsSort(list, comparator) {
  if (list.m() <= 1)
    return Unit_instance;
  var array = copyToArray(list);
  sortArrayWith(array, comparator);
  var inductionVariable = 0;
  var last = array.length;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      list.m1(i, array[i]);
    }
     while (inductionVariable < last);
}
function mapCapacity(expectedSize) {
  return expectedSize;
}
function AbstractMutableCollection() {
  AbstractCollection.call(this);
}
protoOf(AbstractMutableCollection).toJSON = function () {
  return this.toArray();
};
protoOf(AbstractMutableCollection).n1 = function () {
};
function IteratorImpl($outer) {
  this.q1_1 = $outer;
  this.o1_1 = 0;
  this.p1_1 = -1;
}
protoOf(IteratorImpl).k = function () {
  return this.o1_1 < this.q1_1.m();
};
protoOf(IteratorImpl).l = function () {
  if (!this.k())
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.o1_1;
  this.o1_1 = _unary__edvuaz + 1 | 0;
  tmp.p1_1 = _unary__edvuaz;
  return this.q1_1.n(this.p1_1);
};
function ListIteratorImpl($outer, index) {
  this.u1_1 = $outer;
  IteratorImpl.call(this, $outer);
  Companion_instance_4.v1(index, this.u1_1.m());
  this.o1_1 = index;
}
function SubList(list, fromIndex, toIndex) {
  AbstractMutableList.call(this);
  this.x1_1 = list;
  this.y1_1 = fromIndex;
  this.z1_1 = 0;
  Companion_instance_4.k1(this.y1_1, toIndex, this.x1_1.m());
  this.z1_1 = toIndex - this.y1_1 | 0;
}
protoOf(SubList).a2 = function (index, element) {
  Companion_instance_4.v1(index, this.z1_1);
  this.x1_1.a2(this.y1_1 + index | 0, element);
  this.z1_1 = this.z1_1 + 1 | 0;
};
protoOf(SubList).n = function (index) {
  Companion_instance_4.c2(index, this.z1_1);
  return this.x1_1.n(this.y1_1 + index | 0);
};
protoOf(SubList).m1 = function (index, element) {
  Companion_instance_4.c2(index, this.z1_1);
  return this.x1_1.m1(this.y1_1 + index | 0, element);
};
protoOf(SubList).m = function () {
  return this.z1_1;
};
protoOf(SubList).n1 = function () {
  return this.x1_1.n1();
};
function AbstractMutableList() {
  AbstractMutableCollection.call(this);
  this.b2_1 = 0;
}
protoOf(AbstractMutableList).i = function (element) {
  this.n1();
  this.a2(this.m(), element);
  return true;
};
protoOf(AbstractMutableList).j = function () {
  return new IteratorImpl(this);
};
protoOf(AbstractMutableList).p = function (element) {
  return this.r(element) >= 0;
};
protoOf(AbstractMutableList).r = function (element) {
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.collections.indexOfFirst' call
    var index = 0;
    var _iterator__ex2g4s = this.j();
    while (_iterator__ex2g4s.k()) {
      var item = _iterator__ex2g4s.l();
      if (equals(item, element)) {
        tmp$ret$0 = index;
        break $l$block;
      }
      index = index + 1 | 0;
    }
    tmp$ret$0 = -1;
  }
  return tmp$ret$0;
};
protoOf(AbstractMutableList).q = function (index) {
  return new ListIteratorImpl(this, index);
};
protoOf(AbstractMutableList).d2 = function (fromIndex, toIndex) {
  return new SubList(this, fromIndex, toIndex);
};
protoOf(AbstractMutableList).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtList) : false))
    return false;
  return Companion_instance_4.e2(this, other);
};
protoOf(AbstractMutableList).hashCode = function () {
  return Companion_instance_4.f2(this);
};
function AbstractMutableSet() {
  AbstractMutableCollection.call(this);
}
protoOf(AbstractMutableSet).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtSet) : false))
    return false;
  return Companion_instance_5.g2(this, other);
};
protoOf(AbstractMutableSet).hashCode = function () {
  return Companion_instance_5.h2(this);
};
function arrayOfUninitializedElements(capacity) {
  // Inline function 'kotlin.require' call
  if (!(capacity >= 0)) {
    var message = 'capacity must be non-negative.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  // Inline function 'kotlin.arrayOfNulls' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return Array(capacity);
}
function resetRange(_this__u8e3s4, fromIndex, toIndex) {
  // Inline function 'kotlin.js.nativeFill' call
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.fill(null, fromIndex, toIndex);
}
function copyOfUninitializedElements(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return copyOf_0(_this__u8e3s4, newSize);
}
function Companion_1() {
  Companion_instance_1 = this;
  var tmp = this;
  // Inline function 'kotlin.also' call
  var this_0 = ArrayList_init_$Create$_0(0);
  this_0.h_1 = true;
  tmp.i2_1 = this_0;
}
var Companion_instance_1;
function Companion_getInstance_1() {
  if (Companion_instance_1 == null)
    new Companion_1();
  return Companion_instance_1;
}
function ArrayList_init_$Init$($this) {
  // Inline function 'kotlin.emptyArray' call
  var tmp$ret$0 = [];
  ArrayList.call($this, tmp$ret$0);
  return $this;
}
function ArrayList_init_$Create$() {
  return ArrayList_init_$Init$(objectCreate(protoOf(ArrayList)));
}
function ArrayList_init_$Init$_0(initialCapacity, $this) {
  // Inline function 'kotlin.emptyArray' call
  var tmp$ret$0 = [];
  ArrayList.call($this, tmp$ret$0);
  // Inline function 'kotlin.require' call
  if (!(initialCapacity >= 0)) {
    var message = 'Negative initial capacity: ' + initialCapacity;
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return $this;
}
function ArrayList_init_$Create$_0(initialCapacity) {
  return ArrayList_init_$Init$_0(initialCapacity, objectCreate(protoOf(ArrayList)));
}
function ArrayList_init_$Init$_1(elements, $this) {
  // Inline function 'kotlin.collections.toTypedArray' call
  var tmp$ret$0 = copyToArray(elements);
  ArrayList.call($this, tmp$ret$0);
  return $this;
}
function ArrayList_init_$Create$_1(elements) {
  return ArrayList_init_$Init$_1(elements, objectCreate(protoOf(ArrayList)));
}
function rangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_4.c2(index, $this.m());
  return index;
}
function insertionRangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_4.v1(index, $this.m());
  return index;
}
function ArrayList(array) {
  Companion_getInstance_1();
  AbstractMutableList.call(this);
  this.g_1 = array;
  this.h_1 = false;
}
protoOf(ArrayList).m = function () {
  return this.g_1.length;
};
protoOf(ArrayList).n = function (index) {
  return this.g_1[rangeCheck(this, index)];
};
protoOf(ArrayList).m1 = function (index, element) {
  this.n1();
  rangeCheck(this, index);
  // Inline function 'kotlin.apply' call
  var this_0 = this.g_1[index];
  this.g_1[index] = element;
  return this_0;
};
protoOf(ArrayList).i = function (element) {
  this.n1();
  // Inline function 'kotlin.js.asDynamic' call
  this.g_1.push(element);
  this.b2_1 = this.b2_1 + 1 | 0;
  return true;
};
protoOf(ArrayList).a2 = function (index, element) {
  this.n1();
  // Inline function 'kotlin.js.asDynamic' call
  this.g_1.splice(insertionRangeCheck(this, index), 0, element);
  this.b2_1 = this.b2_1 + 1 | 0;
};
protoOf(ArrayList).j2 = function () {
  this.n1();
  var tmp = this;
  // Inline function 'kotlin.emptyArray' call
  tmp.g_1 = [];
  this.b2_1 = this.b2_1 + 1 | 0;
};
protoOf(ArrayList).r = function (element) {
  return indexOf(this.g_1, element);
};
protoOf(ArrayList).toString = function () {
  return arrayToString(this.g_1);
};
protoOf(ArrayList).k2 = function () {
  return [].slice.call(this.g_1);
};
protoOf(ArrayList).toArray = function () {
  return this.k2();
};
protoOf(ArrayList).n1 = function () {
  if (this.h_1)
    throw UnsupportedOperationException_init_$Create$();
};
var _stableSortingIsSupported;
function sortArray(array) {
  if (getStableSortingIsSupported()) {
    var comparison = sortArray$lambda;
    // Inline function 'kotlin.js.asDynamic' call
    array.sort(comparison);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    mergeSort(array, 0, get_lastIndex(array), naturalOrder());
  }
}
function sortArrayWith(array, comparator) {
  if (getStableSortingIsSupported()) {
    var comparison = sortArrayWith$lambda(comparator);
    // Inline function 'kotlin.js.asDynamic' call
    array.sort(comparison);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    mergeSort(array, 0, get_lastIndex(array), comparator);
  }
}
function getStableSortingIsSupported() {
  var tmp0_safe_receiver = _stableSortingIsSupported;
  if (tmp0_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    return tmp0_safe_receiver;
  }
  _stableSortingIsSupported = false;
  // Inline function 'kotlin.js.unsafeCast' call
  var array = [];
  var inductionVariable = 0;
  if (inductionVariable < 600)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      // Inline function 'kotlin.js.asDynamic' call
      array.push(index);
    }
     while (inductionVariable < 600);
  var comparison = getStableSortingIsSupported$lambda;
  // Inline function 'kotlin.js.asDynamic' call
  array.sort(comparison);
  var inductionVariable_0 = 1;
  var last = array.length;
  if (inductionVariable_0 < last)
    do {
      var index_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      var a = array[index_0 - 1 | 0];
      var b = array[index_0];
      if ((a & 3) === (b & 3) && a >= b)
        return false;
    }
     while (inductionVariable_0 < last);
  _stableSortingIsSupported = true;
  return true;
}
function mergeSort(array, start, endInclusive, comparator) {
  // Inline function 'kotlin.arrayOfNulls' call
  var size = array.length;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var buffer = Array(size);
  var result = mergeSort_0(array, buffer, start, endInclusive, comparator);
  if (!(result === array)) {
    var inductionVariable = start;
    if (inductionVariable <= endInclusive)
      do {
        var i = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        array[i] = result[i];
      }
       while (!(i === endInclusive));
  }
}
function mergeSort_0(array, buffer, start, end, comparator) {
  if (start === end) {
    return array;
  }
  var median = (start + end | 0) / 2 | 0;
  var left = mergeSort_0(array, buffer, start, median, comparator);
  var right = mergeSort_0(array, buffer, median + 1 | 0, end, comparator);
  var target = left === buffer ? array : buffer;
  var leftIndex = start;
  var rightIndex = median + 1 | 0;
  var inductionVariable = start;
  if (inductionVariable <= end)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (leftIndex <= median && rightIndex <= end) {
        var leftValue = left[leftIndex];
        var rightValue = right[rightIndex];
        if (comparator.compare(leftValue, rightValue) <= 0) {
          target[i] = leftValue;
          leftIndex = leftIndex + 1 | 0;
        } else {
          target[i] = rightValue;
          rightIndex = rightIndex + 1 | 0;
        }
      } else if (leftIndex <= median) {
        target[i] = left[leftIndex];
        leftIndex = leftIndex + 1 | 0;
      } else {
        target[i] = right[rightIndex];
        rightIndex = rightIndex + 1 | 0;
      }
    }
     while (!(i === end));
  return target;
}
function sortArray$lambda(a, b) {
  return compareTo(a, b);
}
function sortArrayWith$lambda($comparator) {
  return function (a, b) {
    return $comparator.compare(a, b);
  };
}
function getStableSortingIsSupported$lambda(a, b) {
  return (a & 3) - (b & 3) | 0;
}
function HashSet_init_$Init$(map, $this) {
  AbstractMutableSet.call($this);
  HashSet.call($this);
  $this.l2_1 = map;
  return $this;
}
function HashSet_init_$Init$_0($this) {
  HashSet_init_$Init$(InternalHashMap_init_$Create$(), $this);
  return $this;
}
function HashSet_init_$Create$() {
  return HashSet_init_$Init$_0(objectCreate(protoOf(HashSet)));
}
function HashSet_init_$Init$_1(initialCapacity, loadFactor, $this) {
  HashSet_init_$Init$(InternalHashMap_init_$Create$_0(initialCapacity, loadFactor), $this);
  return $this;
}
function HashSet_init_$Init$_2(initialCapacity, $this) {
  HashSet_init_$Init$_1(initialCapacity, 1.0, $this);
  return $this;
}
function HashSet_init_$Create$_0(initialCapacity) {
  return HashSet_init_$Init$_2(initialCapacity, objectCreate(protoOf(HashSet)));
}
protoOf(HashSet).i = function (element) {
  return this.l2_1.m2(element, true) == null;
};
protoOf(HashSet).p = function (element) {
  return this.l2_1.n2(element);
};
protoOf(HashSet).o = function () {
  return this.l2_1.m() === 0;
};
protoOf(HashSet).j = function () {
  return this.l2_1.o2();
};
protoOf(HashSet).m = function () {
  return this.l2_1.m();
};
function HashSet() {
}
function computeHashSize($this, capacity) {
  return takeHighestOneBit(imul_0(coerceAtLeast(capacity, 1), 3));
}
function computeShift($this, hashSize) {
  // Inline function 'kotlin.countLeadingZeroBits' call
  return clz32(hashSize) + 1 | 0;
}
function checkForComodification($this) {
  if (!($this.z2_1.w2_1 === $this.b3_1))
    throw ConcurrentModificationException_init_$Create$_0('The backing map has been modified after this entry was obtained.');
}
function InternalHashMap_init_$Init$($this) {
  InternalHashMap_init_$Init$_0(8, $this);
  return $this;
}
function InternalHashMap_init_$Create$() {
  return InternalHashMap_init_$Init$(objectCreate(protoOf(InternalHashMap)));
}
function InternalHashMap_init_$Init$_0(initialCapacity, $this) {
  InternalHashMap.call($this, arrayOfUninitializedElements(initialCapacity), null, new Int32Array(initialCapacity), new Int32Array(computeHashSize(Companion_instance_2, initialCapacity)), 2, 0);
  return $this;
}
function InternalHashMap_init_$Init$_1(initialCapacity, loadFactor, $this) {
  InternalHashMap_init_$Init$_0(initialCapacity, $this);
  // Inline function 'kotlin.require' call
  if (!(loadFactor > 0)) {
    var message = 'Non-positive load factor: ' + loadFactor;
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return $this;
}
function InternalHashMap_init_$Create$_0(initialCapacity, loadFactor) {
  return InternalHashMap_init_$Init$_1(initialCapacity, loadFactor, objectCreate(protoOf(InternalHashMap)));
}
function _get_capacity__a9k9f3($this) {
  return $this.p2_1.length;
}
function _get_hashSize__tftcho($this) {
  return $this.s2_1.length;
}
function registerModification($this) {
  $this.w2_1 = $this.w2_1 + 1 | 0;
}
function ensureExtraCapacity($this, n) {
  if (shouldCompact($this, n)) {
    compact($this, true);
  } else {
    ensureCapacity($this, $this.u2_1 + n | 0);
  }
}
function shouldCompact($this, extraCapacity) {
  var spareCapacity = _get_capacity__a9k9f3($this) - $this.u2_1 | 0;
  var gaps = $this.u2_1 - $this.m() | 0;
  return spareCapacity < extraCapacity && (gaps + spareCapacity | 0) >= extraCapacity && gaps >= (_get_capacity__a9k9f3($this) / 4 | 0);
}
function ensureCapacity($this, minCapacity) {
  if (minCapacity < 0)
    throw RuntimeException_init_$Create$_0('too many elements');
  if (minCapacity > _get_capacity__a9k9f3($this)) {
    var newSize = Companion_instance_4.c3(_get_capacity__a9k9f3($this), minCapacity);
    $this.p2_1 = copyOfUninitializedElements($this.p2_1, newSize);
    var tmp = $this;
    var tmp0_safe_receiver = $this.q2_1;
    tmp.q2_1 = tmp0_safe_receiver == null ? null : copyOfUninitializedElements(tmp0_safe_receiver, newSize);
    $this.r2_1 = copyOf($this.r2_1, newSize);
    var newHashSize = computeHashSize(Companion_instance_2, newSize);
    if (newHashSize > _get_hashSize__tftcho($this)) {
      rehash($this, newHashSize);
    }
  }
}
function allocateValuesArray($this) {
  var curValuesArray = $this.q2_1;
  if (!(curValuesArray == null))
    return curValuesArray;
  var newValuesArray = arrayOfUninitializedElements(_get_capacity__a9k9f3($this));
  $this.q2_1 = newValuesArray;
  return newValuesArray;
}
function hash($this, key) {
  return key == null ? 0 : imul_0(hashCode_0(key), -1640531527) >>> $this.v2_1 | 0;
}
function compact($this, updateHashArray) {
  var i = 0;
  var j = 0;
  var valuesArray = $this.q2_1;
  while (i < $this.u2_1) {
    var hash = $this.r2_1[i];
    if (hash >= 0) {
      $this.p2_1[j] = $this.p2_1[i];
      if (!(valuesArray == null)) {
        valuesArray[j] = valuesArray[i];
      }
      if (updateHashArray) {
        $this.r2_1[j] = hash;
        $this.s2_1[hash] = j + 1 | 0;
      }
      j = j + 1 | 0;
    }
    i = i + 1 | 0;
  }
  resetRange($this.p2_1, j, $this.u2_1);
  if (valuesArray == null)
    null;
  else {
    resetRange(valuesArray, j, $this.u2_1);
  }
  $this.u2_1 = j;
}
function rehash($this, newHashSize) {
  registerModification($this);
  if ($this.u2_1 > $this.x2_1) {
    compact($this, false);
  }
  $this.s2_1 = new Int32Array(newHashSize);
  $this.v2_1 = computeShift(Companion_instance_2, newHashSize);
  var i = 0;
  while (i < $this.u2_1) {
    var _unary__edvuaz = i;
    i = _unary__edvuaz + 1 | 0;
    if (!putRehash($this, _unary__edvuaz)) {
      throw IllegalStateException_init_$Create$_0('This cannot happen with fixed magic multiplier and grow-only hash array. Have object hashCodes changed?');
    }
  }
}
function putRehash($this, i) {
  var hash_0 = hash($this, $this.p2_1[i]);
  var probesLeft = $this.t2_1;
  while (true) {
    var index = $this.s2_1[hash_0];
    if (index === 0) {
      $this.s2_1[hash_0] = i + 1 | 0;
      $this.r2_1[i] = hash_0;
      return true;
    }
    probesLeft = probesLeft - 1 | 0;
    if (probesLeft < 0)
      return false;
    var _unary__edvuaz = hash_0;
    hash_0 = _unary__edvuaz - 1 | 0;
    if (_unary__edvuaz === 0)
      hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
  }
}
function findKey($this, key) {
  var hash_0 = hash($this, key);
  var probesLeft = $this.t2_1;
  while (true) {
    var index = $this.s2_1[hash_0];
    if (index === 0)
      return -1;
    if (equals($this.p2_1[index - 1 | 0], key))
      return index - 1 | 0;
    probesLeft = probesLeft - 1 | 0;
    if (probesLeft < 0)
      return -1;
    var _unary__edvuaz = hash_0;
    hash_0 = _unary__edvuaz - 1 | 0;
    if (_unary__edvuaz === 0)
      hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
  }
}
function addKey($this, key) {
  $this.d3();
  retry: while (true) {
    var hash_0 = hash($this, key);
    var tentativeMaxProbeDistance = coerceAtMost(imul_0($this.t2_1, 2), _get_hashSize__tftcho($this) / 2 | 0);
    var probeDistance = 0;
    while (true) {
      var index = $this.s2_1[hash_0];
      if (index === 0) {
        if ($this.u2_1 >= _get_capacity__a9k9f3($this)) {
          ensureExtraCapacity($this, 1);
          continue retry;
        }
        var _unary__edvuaz = $this.u2_1;
        $this.u2_1 = _unary__edvuaz + 1 | 0;
        var putIndex = _unary__edvuaz;
        $this.p2_1[putIndex] = key;
        $this.r2_1[putIndex] = hash_0;
        $this.s2_1[hash_0] = putIndex + 1 | 0;
        $this.x2_1 = $this.x2_1 + 1 | 0;
        registerModification($this);
        if (probeDistance > $this.t2_1)
          $this.t2_1 = probeDistance;
        return putIndex;
      }
      if (equals($this.p2_1[index - 1 | 0], key)) {
        return -index | 0;
      }
      probeDistance = probeDistance + 1 | 0;
      if (probeDistance > tentativeMaxProbeDistance) {
        rehash($this, imul_0(_get_hashSize__tftcho($this), 2));
        continue retry;
      }
      var _unary__edvuaz_0 = hash_0;
      hash_0 = _unary__edvuaz_0 - 1 | 0;
      if (_unary__edvuaz_0 === 0)
        hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
    }
  }
}
function contentEquals($this, other) {
  return $this.x2_1 === other.m() && $this.e3(other.x());
}
function Companion_2() {
  this.f3_1 = -1640531527;
  this.g3_1 = 8;
  this.h3_1 = 2;
  this.i3_1 = -1;
}
var Companion_instance_2;
function Companion_getInstance_2() {
  return Companion_instance_2;
}
function Itr(map) {
  this.j3_1 = map;
  this.k3_1 = 0;
  this.l3_1 = -1;
  this.m3_1 = this.j3_1.w2_1;
  this.n3();
}
protoOf(Itr).n3 = function () {
  while (this.k3_1 < this.j3_1.u2_1 && this.j3_1.r2_1[this.k3_1] < 0) {
    this.k3_1 = this.k3_1 + 1 | 0;
  }
};
protoOf(Itr).k = function () {
  return this.k3_1 < this.j3_1.u2_1;
};
protoOf(Itr).o3 = function () {
  if (!(this.j3_1.w2_1 === this.m3_1))
    throw ConcurrentModificationException_init_$Create$();
};
function KeysItr(map) {
  Itr.call(this, map);
}
protoOf(KeysItr).l = function () {
  this.o3();
  if (this.k3_1 >= this.j3_1.u2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.k3_1;
  this.k3_1 = _unary__edvuaz + 1 | 0;
  tmp.l3_1 = _unary__edvuaz;
  var result = this.j3_1.p2_1[this.l3_1];
  this.n3();
  return result;
};
function EntriesItr(map) {
  Itr.call(this, map);
}
protoOf(EntriesItr).l = function () {
  this.o3();
  if (this.k3_1 >= this.j3_1.u2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.k3_1;
  this.k3_1 = _unary__edvuaz + 1 | 0;
  tmp.l3_1 = _unary__edvuaz;
  var result = new EntryRef(this.j3_1, this.l3_1);
  this.n3();
  return result;
};
protoOf(EntriesItr).x3 = function () {
  if (this.k3_1 >= this.j3_1.u2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.k3_1;
  this.k3_1 = _unary__edvuaz + 1 | 0;
  tmp.l3_1 = _unary__edvuaz;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.j3_1.p2_1[this.l3_1];
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode_0(tmp0_safe_receiver);
  var tmp_0 = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = ensureNotNull(this.j3_1.q2_1)[this.l3_1];
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode_0(tmp0_safe_receiver_0);
  var result = tmp_0 ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
  this.n3();
  return result;
};
protoOf(EntriesItr).y3 = function (sb) {
  if (this.k3_1 >= this.j3_1.u2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.k3_1;
  this.k3_1 = _unary__edvuaz + 1 | 0;
  tmp.l3_1 = _unary__edvuaz;
  var key = this.j3_1.p2_1[this.l3_1];
  if (equals(key, this.j3_1))
    sb.b4('(this Map)');
  else
    sb.a4(key);
  sb.c4(_Char___init__impl__6a9atx(61));
  var value = ensureNotNull(this.j3_1.q2_1)[this.l3_1];
  if (equals(value, this.j3_1))
    sb.b4('(this Map)');
  else
    sb.a4(value);
  this.n3();
};
function EntryRef(map, index) {
  this.z2_1 = map;
  this.a3_1 = index;
  this.b3_1 = this.z2_1.w2_1;
}
protoOf(EntryRef).v = function () {
  checkForComodification(this);
  return this.z2_1.p2_1[this.a3_1];
};
protoOf(EntryRef).w = function () {
  checkForComodification(this);
  return ensureNotNull(this.z2_1.q2_1)[this.a3_1];
};
protoOf(EntryRef).equals = function (other) {
  var tmp;
  var tmp_0;
  if (!(other == null) ? isInterface(other, Entry) : false) {
    tmp_0 = equals(other.v(), this.v());
  } else {
    tmp_0 = false;
  }
  if (tmp_0) {
    tmp = equals(other.w(), this.w());
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EntryRef).hashCode = function () {
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.v();
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode_0(tmp0_safe_receiver);
  var tmp = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = this.w();
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode_0(tmp0_safe_receiver_0);
  return tmp ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
};
protoOf(EntryRef).toString = function () {
  return toString_0(this.v()) + '=' + toString_0(this.w());
};
function InternalHashMap(keysArray, valuesArray, presenceArray, hashArray, maxProbeDistance, length) {
  this.p2_1 = keysArray;
  this.q2_1 = valuesArray;
  this.r2_1 = presenceArray;
  this.s2_1 = hashArray;
  this.t2_1 = maxProbeDistance;
  this.u2_1 = length;
  this.v2_1 = computeShift(Companion_instance_2, _get_hashSize__tftcho(this));
  this.w2_1 = 0;
  this.x2_1 = 0;
  this.y2_1 = false;
}
protoOf(InternalHashMap).m = function () {
  return this.x2_1;
};
protoOf(InternalHashMap).n2 = function (key) {
  return findKey(this, key) >= 0;
};
protoOf(InternalHashMap).m2 = function (key, value) {
  var index = addKey(this, key);
  var valuesArray = allocateValuesArray(this);
  if (index < 0) {
    var oldValue = valuesArray[(-index | 0) - 1 | 0];
    valuesArray[(-index | 0) - 1 | 0] = value;
    return oldValue;
  } else {
    valuesArray[index] = value;
    return null;
  }
};
protoOf(InternalHashMap).equals = function (other) {
  var tmp;
  if (other === this) {
    tmp = true;
  } else {
    var tmp_0;
    if (!(other == null) ? isInterface(other, KtMap) : false) {
      tmp_0 = contentEquals(this, other);
    } else {
      tmp_0 = false;
    }
    tmp = tmp_0;
  }
  return tmp;
};
protoOf(InternalHashMap).hashCode = function () {
  var result = 0;
  var it = this.d4();
  while (it.k()) {
    result = result + it.x3() | 0;
  }
  return result;
};
protoOf(InternalHashMap).toString = function () {
  var sb = StringBuilder_init_$Create$(2 + imul_0(this.x2_1, 3) | 0);
  sb.b4('{');
  var i = 0;
  var it = this.d4();
  while (it.k()) {
    if (i > 0) {
      sb.b4(', ');
    }
    it.y3(sb);
    i = i + 1 | 0;
  }
  sb.b4('}');
  return sb.toString();
};
protoOf(InternalHashMap).d3 = function () {
  if (this.y2_1)
    throw UnsupportedOperationException_init_$Create$();
};
protoOf(InternalHashMap).e4 = function (entry) {
  var index = findKey(this, entry.v());
  if (index < 0)
    return false;
  return equals(ensureNotNull(this.q2_1)[index], entry.w());
};
protoOf(InternalHashMap).f4 = function (entry) {
  return this.e4(isInterface(entry, Entry) ? entry : THROW_CCE());
};
protoOf(InternalHashMap).o2 = function () {
  return new KeysItr(this);
};
protoOf(InternalHashMap).d4 = function () {
  return new EntriesItr(this);
};
function InternalMap() {
}
function LinkedHashSet_init_$Init$($this) {
  HashSet_init_$Init$_0($this);
  LinkedHashSet.call($this);
  return $this;
}
function LinkedHashSet_init_$Create$() {
  return LinkedHashSet_init_$Init$(objectCreate(protoOf(LinkedHashSet)));
}
function LinkedHashSet_init_$Init$_0(initialCapacity, loadFactor, $this) {
  HashSet_init_$Init$_1(initialCapacity, loadFactor, $this);
  LinkedHashSet.call($this);
  return $this;
}
function LinkedHashSet_init_$Init$_1(initialCapacity, $this) {
  LinkedHashSet_init_$Init$_0(initialCapacity, 1.0, $this);
  return $this;
}
function LinkedHashSet_init_$Create$_0(initialCapacity) {
  return LinkedHashSet_init_$Init$_1(initialCapacity, objectCreate(protoOf(LinkedHashSet)));
}
function LinkedHashSet() {
}
function RandomAccess() {
}
function UnsupportedOperationException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  UnsupportedOperationException.call($this);
  return $this;
}
function UnsupportedOperationException_init_$Create$() {
  var tmp = UnsupportedOperationException_init_$Init$(objectCreate(protoOf(UnsupportedOperationException)));
  captureStack(tmp, UnsupportedOperationException_init_$Create$);
  return tmp;
}
function UnsupportedOperationException() {
  captureStack(this, UnsupportedOperationException);
}
function IllegalArgumentException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IllegalArgumentException.call($this);
  return $this;
}
function IllegalArgumentException_init_$Create$() {
  var tmp = IllegalArgumentException_init_$Init$(objectCreate(protoOf(IllegalArgumentException)));
  captureStack(tmp, IllegalArgumentException_init_$Create$);
  return tmp;
}
function IllegalArgumentException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IllegalArgumentException.call($this);
  return $this;
}
function IllegalArgumentException_init_$Create$_0(message) {
  var tmp = IllegalArgumentException_init_$Init$_0(message, objectCreate(protoOf(IllegalArgumentException)));
  captureStack(tmp, IllegalArgumentException_init_$Create$_0);
  return tmp;
}
function IllegalArgumentException() {
  captureStack(this, IllegalArgumentException);
}
function RuntimeException_init_$Init$($this) {
  Exception_init_$Init$($this);
  RuntimeException.call($this);
  return $this;
}
function RuntimeException_init_$Create$() {
  var tmp = RuntimeException_init_$Init$(objectCreate(protoOf(RuntimeException)));
  captureStack(tmp, RuntimeException_init_$Create$);
  return tmp;
}
function RuntimeException_init_$Init$_0(message, $this) {
  Exception_init_$Init$_0(message, $this);
  RuntimeException.call($this);
  return $this;
}
function RuntimeException_init_$Create$_0(message) {
  var tmp = RuntimeException_init_$Init$_0(message, objectCreate(protoOf(RuntimeException)));
  captureStack(tmp, RuntimeException_init_$Create$_0);
  return tmp;
}
function RuntimeException() {
  captureStack(this, RuntimeException);
}
function Exception_init_$Init$($this) {
  extendThrowable($this);
  Exception.call($this);
  return $this;
}
function Exception_init_$Create$() {
  var tmp = Exception_init_$Init$(objectCreate(protoOf(Exception)));
  captureStack(tmp, Exception_init_$Create$);
  return tmp;
}
function Exception_init_$Init$_0(message, $this) {
  extendThrowable($this, message);
  Exception.call($this);
  return $this;
}
function Exception_init_$Create$_0(message) {
  var tmp = Exception_init_$Init$_0(message, objectCreate(protoOf(Exception)));
  captureStack(tmp, Exception_init_$Create$_0);
  return tmp;
}
function Exception() {
  captureStack(this, Exception);
}
function NoSuchElementException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  NoSuchElementException.call($this);
  return $this;
}
function NoSuchElementException_init_$Create$() {
  var tmp = NoSuchElementException_init_$Init$(objectCreate(protoOf(NoSuchElementException)));
  captureStack(tmp, NoSuchElementException_init_$Create$);
  return tmp;
}
function NoSuchElementException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  NoSuchElementException.call($this);
  return $this;
}
function NoSuchElementException_init_$Create$_0(message) {
  var tmp = NoSuchElementException_init_$Init$_0(message, objectCreate(protoOf(NoSuchElementException)));
  captureStack(tmp, NoSuchElementException_init_$Create$_0);
  return tmp;
}
function NoSuchElementException() {
  captureStack(this, NoSuchElementException);
}
function IndexOutOfBoundsException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IndexOutOfBoundsException.call($this);
  return $this;
}
function IndexOutOfBoundsException_init_$Create$() {
  var tmp = IndexOutOfBoundsException_init_$Init$(objectCreate(protoOf(IndexOutOfBoundsException)));
  captureStack(tmp, IndexOutOfBoundsException_init_$Create$);
  return tmp;
}
function IndexOutOfBoundsException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IndexOutOfBoundsException.call($this);
  return $this;
}
function IndexOutOfBoundsException_init_$Create$_0(message) {
  var tmp = IndexOutOfBoundsException_init_$Init$_0(message, objectCreate(protoOf(IndexOutOfBoundsException)));
  captureStack(tmp, IndexOutOfBoundsException_init_$Create$_0);
  return tmp;
}
function IndexOutOfBoundsException() {
  captureStack(this, IndexOutOfBoundsException);
}
function IllegalStateException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IllegalStateException.call($this);
  return $this;
}
function IllegalStateException_init_$Create$() {
  var tmp = IllegalStateException_init_$Init$(objectCreate(protoOf(IllegalStateException)));
  captureStack(tmp, IllegalStateException_init_$Create$);
  return tmp;
}
function IllegalStateException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IllegalStateException.call($this);
  return $this;
}
function IllegalStateException_init_$Create$_0(message) {
  var tmp = IllegalStateException_init_$Init$_0(message, objectCreate(protoOf(IllegalStateException)));
  captureStack(tmp, IllegalStateException_init_$Create$_0);
  return tmp;
}
function IllegalStateException() {
  captureStack(this, IllegalStateException);
}
function ConcurrentModificationException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ConcurrentModificationException.call($this);
  return $this;
}
function ConcurrentModificationException_init_$Create$() {
  var tmp = ConcurrentModificationException_init_$Init$(objectCreate(protoOf(ConcurrentModificationException)));
  captureStack(tmp, ConcurrentModificationException_init_$Create$);
  return tmp;
}
function ConcurrentModificationException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  ConcurrentModificationException.call($this);
  return $this;
}
function ConcurrentModificationException_init_$Create$_0(message) {
  var tmp = ConcurrentModificationException_init_$Init$_0(message, objectCreate(protoOf(ConcurrentModificationException)));
  captureStack(tmp, ConcurrentModificationException_init_$Create$_0);
  return tmp;
}
function ConcurrentModificationException() {
  captureStack(this, ConcurrentModificationException);
}
function ArithmeticException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ArithmeticException.call($this);
  return $this;
}
function ArithmeticException_init_$Create$() {
  var tmp = ArithmeticException_init_$Init$(objectCreate(protoOf(ArithmeticException)));
  captureStack(tmp, ArithmeticException_init_$Create$);
  return tmp;
}
function ArithmeticException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  ArithmeticException.call($this);
  return $this;
}
function ArithmeticException_init_$Create$_0(message) {
  var tmp = ArithmeticException_init_$Init$_0(message, objectCreate(protoOf(ArithmeticException)));
  captureStack(tmp, ArithmeticException_init_$Create$_0);
  return tmp;
}
function ArithmeticException() {
  captureStack(this, ArithmeticException);
}
function NoWhenBranchMatchedException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  NoWhenBranchMatchedException.call($this);
  return $this;
}
function NoWhenBranchMatchedException_init_$Create$() {
  var tmp = NoWhenBranchMatchedException_init_$Init$(objectCreate(protoOf(NoWhenBranchMatchedException)));
  captureStack(tmp, NoWhenBranchMatchedException_init_$Create$);
  return tmp;
}
function NoWhenBranchMatchedException() {
  captureStack(this, NoWhenBranchMatchedException);
}
function NullPointerException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  NullPointerException.call($this);
  return $this;
}
function NullPointerException_init_$Create$() {
  var tmp = NullPointerException_init_$Init$(objectCreate(protoOf(NullPointerException)));
  captureStack(tmp, NullPointerException_init_$Create$);
  return tmp;
}
function NullPointerException() {
  captureStack(this, NullPointerException);
}
function ClassCastException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ClassCastException.call($this);
  return $this;
}
function ClassCastException_init_$Create$() {
  var tmp = ClassCastException_init_$Init$(objectCreate(protoOf(ClassCastException)));
  captureStack(tmp, ClassCastException_init_$Create$);
  return tmp;
}
function ClassCastException() {
  captureStack(this, ClassCastException);
}
function fillFrom(src, dst) {
  var srcLen = src.length;
  var dstLen = dst.length;
  var index = 0;
  // Inline function 'kotlin.js.unsafeCast' call
  var arr = dst;
  while (index < srcLen && index < dstLen) {
    var tmp = index;
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    arr[tmp] = src[_unary__edvuaz];
  }
  return dst;
}
function arrayCopyResize(source, newSize, defaultValue) {
  // Inline function 'kotlin.js.unsafeCast' call
  var result = source.slice(0, newSize);
  // Inline function 'kotlin.copyArrayType' call
  if (source.$type$ !== undefined) {
    result.$type$ = source.$type$;
  }
  var index = source.length;
  if (newSize > index) {
    // Inline function 'kotlin.js.asDynamic' call
    result.length = newSize;
    while (index < newSize) {
      var _unary__edvuaz = index;
      index = _unary__edvuaz + 1 | 0;
      result[_unary__edvuaz] = defaultValue;
    }
  }
  return result;
}
function roundToLong(_this__u8e3s4) {
  var tmp;
  if (isNaN_0(_this__u8e3s4)) {
    throw IllegalArgumentException_init_$Create$_0('Cannot round NaN value.');
  } else if (_this__u8e3s4 > toNumber(new Long(-1, 2147483647))) {
    tmp = new Long(-1, 2147483647);
  } else if (_this__u8e3s4 < toNumber(new Long(0, -2147483648))) {
    tmp = new Long(0, -2147483648);
  } else {
    tmp = numberToLong(Math.round(_this__u8e3s4));
  }
  return tmp;
}
function roundToInt(_this__u8e3s4) {
  var tmp;
  if (isNaN_0(_this__u8e3s4)) {
    throw IllegalArgumentException_init_$Create$_0('Cannot round NaN value.');
  } else if (_this__u8e3s4 > 2147483647) {
    tmp = 2147483647;
  } else if (_this__u8e3s4 < -2147483648) {
    tmp = -2147483648;
  } else {
    tmp = numberToInt(Math.round(_this__u8e3s4));
  }
  return tmp;
}
function round(x) {
  if (!(x % 0.5 === 0.0)) {
    return Math.round(x);
  }
  // Inline function 'kotlin.math.floor' call
  var floor = Math.floor(x);
  var tmp;
  if (floor % 2 === 0.0) {
    tmp = floor;
  } else {
    // Inline function 'kotlin.math.ceil' call
    tmp = Math.ceil(x);
  }
  return tmp;
}
function get_INV_2_26() {
  _init_properties_PlatformRandom_kt__6kjv62();
  return INV_2_26;
}
var INV_2_26;
function get_INV_2_53() {
  _init_properties_PlatformRandom_kt__6kjv62();
  return INV_2_53;
}
var INV_2_53;
function doubleFromParts(hi26, low27) {
  _init_properties_PlatformRandom_kt__6kjv62();
  return hi26 * get_INV_2_26() + low27 * get_INV_2_53();
}
function defaultPlatformRandom() {
  _init_properties_PlatformRandom_kt__6kjv62();
  // Inline function 'kotlin.js.unsafeCast' call
  var tmp$ret$0 = Math.random() * Math.pow(2, 32) | 0;
  return Random_0(tmp$ret$0);
}
var properties_initialized_PlatformRandom_kt_uibhw8;
function _init_properties_PlatformRandom_kt__6kjv62() {
  if (!properties_initialized_PlatformRandom_kt_uibhw8) {
    properties_initialized_PlatformRandom_kt_uibhw8 = true;
    // Inline function 'kotlin.math.pow' call
    INV_2_26 = Math.pow(2.0, -26);
    // Inline function 'kotlin.math.pow' call
    INV_2_53 = Math.pow(2.0, -53);
  }
}
function PrimitiveKClassImpl(jClass, simpleName, isInstanceFunction) {
  KClassImpl.call(this);
  this.i4_1 = jClass;
  this.j4_1 = simpleName;
  this.k4_1 = isInstanceFunction;
}
protoOf(PrimitiveKClassImpl).l4 = function () {
  return this.i4_1;
};
protoOf(PrimitiveKClassImpl).m4 = function () {
  return this.j4_1;
};
function KClassImpl() {
}
protoOf(KClassImpl).equals = function (other) {
  var tmp;
  if (other instanceof NothingKClassImpl) {
    tmp = false;
  } else {
    if (other instanceof KClassImpl) {
      tmp = (equals(this.l4(), other.l4()) && this.m4() == other.m4());
    } else {
      tmp = false;
    }
  }
  return tmp;
};
protoOf(KClassImpl).hashCode = function () {
  var tmp0_safe_receiver = this.m4();
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : getStringHashCode(tmp0_safe_receiver);
  return tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
};
protoOf(KClassImpl).toString = function () {
  return 'class ' + this.m4();
};
function NothingKClassImpl() {
}
function StringBuilder_init_$Init$(capacity, $this) {
  StringBuilder_init_$Init$_0($this);
  return $this;
}
function StringBuilder_init_$Create$(capacity) {
  return StringBuilder_init_$Init$(capacity, objectCreate(protoOf(StringBuilder)));
}
function StringBuilder_init_$Init$_0($this) {
  StringBuilder.call($this, '');
  return $this;
}
function StringBuilder_init_$Create$_0() {
  return StringBuilder_init_$Init$_0(objectCreate(protoOf(StringBuilder)));
}
function StringBuilder(content) {
  this.z3_1 = content;
}
protoOf(StringBuilder).a = function () {
  // Inline function 'kotlin.js.asDynamic' call
  return this.z3_1.length;
};
protoOf(StringBuilder).b = function (index) {
  // Inline function 'kotlin.text.getOrElse' call
  var this_0 = this.z3_1;
  var tmp;
  if (0 <= index ? index <= (charSequenceLength(this_0) - 1 | 0) : false) {
    tmp = charSequenceGet(this_0, index);
  } else {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', length: ' + this.a() + '}');
  }
  return tmp;
};
protoOf(StringBuilder).c = function (startIndex, endIndex) {
  return substring(this.z3_1, startIndex, endIndex);
};
protoOf(StringBuilder).c4 = function (value) {
  this.z3_1 = this.z3_1 + toString(value);
  return this;
};
protoOf(StringBuilder).e = function (value) {
  this.z3_1 = this.z3_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).n4 = function (value, startIndex, endIndex) {
  return this.o4(value == null ? 'null' : value, startIndex, endIndex);
};
protoOf(StringBuilder).a4 = function (value) {
  this.z3_1 = this.z3_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).b4 = function (value) {
  var tmp = this;
  var tmp_0 = this.z3_1;
  tmp.z3_1 = tmp_0 + (value == null ? 'null' : value);
  return this;
};
protoOf(StringBuilder).toString = function () {
  return this.z3_1;
};
protoOf(StringBuilder).o4 = function (value, startIndex, endIndex) {
  var stringCsq = toString_1(value);
  Companion_instance_4.p4(startIndex, endIndex, stringCsq.length);
  this.z3_1 = this.z3_1 + substring(stringCsq, startIndex, endIndex);
  return this;
};
function uppercaseChar(_this__u8e3s4) {
  // Inline function 'kotlin.text.uppercase' call
  // Inline function 'kotlin.js.asDynamic' call
  // Inline function 'kotlin.js.unsafeCast' call
  var uppercase = toString(_this__u8e3s4).toUpperCase();
  return uppercase.length > 1 ? _this__u8e3s4 : charCodeAt(uppercase, 0);
}
function isWhitespace(_this__u8e3s4) {
  return isWhitespaceImpl(_this__u8e3s4);
}
function checkRadix(radix) {
  if (!(2 <= radix ? radix <= 36 : false)) {
    throw IllegalArgumentException_init_$Create$_0('radix ' + radix + ' was not in valid range 2..36');
  }
  return radix;
}
function digitOf(char, radix) {
  // Inline function 'kotlin.let' call
  var it = Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(48)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(57)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(48)) : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(90)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(97)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(122)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(97)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(128)) < 0 ? -1 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65313)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65338)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65313)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65345)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65370)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65345)) + 10 | 0 : digitToIntImpl(char);
  return it >= radix ? -1 : it;
}
function Regex_init_$Init$(pattern, $this) {
  Regex.call($this, pattern, emptySet());
  return $this;
}
function Regex_init_$Create$(pattern) {
  return Regex_init_$Init$(pattern, objectCreate(protoOf(Regex)));
}
function Companion_3() {
  Companion_instance_3 = this;
  this.q4_1 = new RegExp('[\\\\^$*+?.()|[\\]{}]', 'g');
  this.r4_1 = new RegExp('[\\\\$]', 'g');
  this.s4_1 = new RegExp('\\$', 'g');
}
var Companion_instance_3;
function Companion_getInstance_3() {
  if (Companion_instance_3 == null)
    new Companion_3();
  return Companion_instance_3;
}
function Regex(pattern, options) {
  Companion_getInstance_3();
  this.t4_1 = pattern;
  this.u4_1 = toSet_0(options);
  this.v4_1 = new RegExp(pattern, toFlags(options, 'gu'));
  this.w4_1 = null;
  this.x4_1 = null;
}
protoOf(Regex).y4 = function (input, startIndex) {
  if (startIndex < 0 || startIndex > charSequenceLength(input)) {
    throw IndexOutOfBoundsException_init_$Create$_0('Start index out of bounds: ' + startIndex + ', input length: ' + charSequenceLength(input));
  }
  return findNext(this.v4_1, toString_1(input), startIndex, this.v4_1);
};
protoOf(Regex).z4 = function (input, startIndex, $super) {
  startIndex = startIndex === VOID ? 0 : startIndex;
  return $super === VOID ? this.y4(input, startIndex) : $super.y4.call(this, input, startIndex);
};
protoOf(Regex).a5 = function (input, transform) {
  var match = this.z4(input);
  if (match == null)
    return toString_1(input);
  var lastStart = 0;
  var length = charSequenceLength(input);
  var sb = StringBuilder_init_$Create$(length);
  do {
    var foundMatch = ensureNotNull(match);
    sb.n4(input, lastStart, foundMatch.b5().f5());
    sb.e(transform(foundMatch));
    lastStart = foundMatch.b5().g5() + 1 | 0;
    match = foundMatch.l();
  }
   while (lastStart < length && !(match == null));
  if (lastStart < length) {
    sb.n4(input, lastStart, length);
  }
  return sb.toString();
};
protoOf(Regex).toString = function () {
  return this.v4_1.toString();
};
function toFlags(_this__u8e3s4, prepend) {
  return joinToString_0(_this__u8e3s4, '', prepend, VOID, VOID, VOID, toFlags$lambda);
}
function findNext(_this__u8e3s4, input, from, nextPattern) {
  _this__u8e3s4.lastIndex = from;
  var match = _this__u8e3s4.exec(input);
  if (match == null)
    return null;
  var range = numberRangeToNumber(match.index, _this__u8e3s4.lastIndex - 1 | 0);
  return new findNext$1(range, match, nextPattern, input);
}
function MatchGroup(value) {
  this.h5_1 = value;
}
protoOf(MatchGroup).toString = function () {
  return 'MatchGroup(value=' + this.h5_1 + ')';
};
protoOf(MatchGroup).hashCode = function () {
  return getStringHashCode(this.h5_1);
};
protoOf(MatchGroup).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof MatchGroup))
    return false;
  if (!(this.h5_1 === other.h5_1))
    return false;
  return true;
};
function toFlags$lambda(it) {
  return it.k5_1;
}
function findNext$o$groups$o$iterator$lambda(this$0) {
  return function (it) {
    return this$0.n(it);
  };
}
function advanceToNextCharacter($this, index) {
  if (index < get_lastIndex_4($this.t5_1)) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var code1 = $this.t5_1.charCodeAt(index);
    if (55296 <= code1 ? code1 <= 56319 : false) {
      // Inline function 'kotlin.js.asDynamic' call
      // Inline function 'kotlin.js.unsafeCast' call
      var code2 = $this.t5_1.charCodeAt(index + 1 | 0);
      if (56320 <= code2 ? code2 <= 57343 : false) {
        return index + 2 | 0;
      }
    }
  }
  return index + 1 | 0;
}
function findNext$1$groups$1($match, this$0) {
  this.l5_1 = $match;
  this.m5_1 = this$0;
  AbstractCollection.call(this);
}
protoOf(findNext$1$groups$1).m = function () {
  return this.l5_1.length;
};
protoOf(findNext$1$groups$1).j = function () {
  var tmp = asSequence(get_indices_1(this));
  return map(tmp, findNext$o$groups$o$iterator$lambda(this)).j();
};
protoOf(findNext$1$groups$1).n = function (index) {
  // Inline function 'kotlin.js.get' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp0_safe_receiver = this.l5_1[index];
  var tmp;
  if (tmp0_safe_receiver == null) {
    tmp = null;
  } else {
    // Inline function 'kotlin.let' call
    tmp = new MatchGroup(tmp0_safe_receiver);
  }
  return tmp;
};
function findNext$1$groupValues$1($match) {
  this.u5_1 = $match;
  AbstractList.call(this);
}
protoOf(findNext$1$groupValues$1).m = function () {
  return this.u5_1.length;
};
protoOf(findNext$1$groupValues$1).n = function (index) {
  // Inline function 'kotlin.js.get' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp0_elvis_lhs = this.u5_1[index];
  return tmp0_elvis_lhs == null ? '' : tmp0_elvis_lhs;
};
function findNext$1($range, $match, $nextPattern, $input) {
  this.q5_1 = $range;
  this.r5_1 = $match;
  this.s5_1 = $nextPattern;
  this.t5_1 = $input;
  this.n5_1 = $range;
  var tmp = this;
  tmp.o5_1 = new findNext$1$groups$1($match, this);
  this.p5_1 = null;
}
protoOf(findNext$1).b5 = function () {
  return this.n5_1;
};
protoOf(findNext$1).v5 = function () {
  if (this.p5_1 == null) {
    var tmp = this;
    tmp.p5_1 = new findNext$1$groupValues$1(this.r5_1);
  }
  return ensureNotNull(this.p5_1);
};
protoOf(findNext$1).l = function () {
  return findNext(this.s5_1, this.t5_1, this.q5_1.o() ? advanceToNextCharacter(this, this.q5_1.f5()) : this.q5_1.g5() + 1 | 0, this.s5_1);
};
var STRING_CASE_INSENSITIVE_ORDER;
function substring(_this__u8e3s4, startIndex, endIndex) {
  _init_properties_stringJs_kt__bg7zye();
  // Inline function 'kotlin.js.asDynamic' call
  return _this__u8e3s4.substring(startIndex, endIndex);
}
function compareTo_0(_this__u8e3s4, other, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  _init_properties_stringJs_kt__bg7zye();
  if (ignoreCase) {
    var n1 = _this__u8e3s4.length;
    var n2 = other.length;
    // Inline function 'kotlin.comparisons.minOf' call
    var min = Math.min(n1, n2);
    if (min === 0)
      return n1 - n2 | 0;
    var inductionVariable = 0;
    if (inductionVariable < min)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        var thisChar = charCodeAt(_this__u8e3s4, index);
        var otherChar = charCodeAt(other, index);
        if (!(thisChar === otherChar)) {
          thisChar = uppercaseChar(thisChar);
          otherChar = uppercaseChar(otherChar);
          if (!(thisChar === otherChar)) {
            // Inline function 'kotlin.text.lowercaseChar' call
            // Inline function 'kotlin.text.lowercase' call
            var this_0 = thisChar;
            // Inline function 'kotlin.js.asDynamic' call
            // Inline function 'kotlin.js.unsafeCast' call
            var tmp$ret$2 = toString(this_0).toLowerCase();
            thisChar = charCodeAt(tmp$ret$2, 0);
            // Inline function 'kotlin.text.lowercaseChar' call
            // Inline function 'kotlin.text.lowercase' call
            var this_1 = otherChar;
            // Inline function 'kotlin.js.asDynamic' call
            // Inline function 'kotlin.js.unsafeCast' call
            var tmp$ret$6 = toString(this_1).toLowerCase();
            otherChar = charCodeAt(tmp$ret$6, 0);
            if (!(thisChar === otherChar)) {
              return Char__compareTo_impl_ypi4mb(thisChar, otherChar);
            }
          }
        }
      }
       while (inductionVariable < min);
    return n1 - n2 | 0;
  } else {
    return compareTo(_this__u8e3s4, other);
  }
}
function sam$kotlin_Comparator$0(function_0) {
  this.w5_1 = function_0;
}
protoOf(sam$kotlin_Comparator$0).x5 = function (a, b) {
  return this.w5_1(a, b);
};
protoOf(sam$kotlin_Comparator$0).compare = function (a, b) {
  return this.x5(a, b);
};
protoOf(sam$kotlin_Comparator$0).i1 = function () {
  return this.w5_1;
};
protoOf(sam$kotlin_Comparator$0).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, Comparator) : false) {
    var tmp_0;
    if (!(other == null) ? isInterface(other, FunctionAdapter) : false) {
      tmp_0 = equals(this.i1(), other.i1());
    } else {
      tmp_0 = false;
    }
    tmp = tmp_0;
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(sam$kotlin_Comparator$0).hashCode = function () {
  return hashCode_0(this.i1());
};
function STRING_CASE_INSENSITIVE_ORDER$lambda(a, b) {
  _init_properties_stringJs_kt__bg7zye();
  return compareTo_0(a, b, true);
}
var properties_initialized_stringJs_kt_nta8o4;
function _init_properties_stringJs_kt__bg7zye() {
  if (!properties_initialized_stringJs_kt_nta8o4) {
    properties_initialized_stringJs_kt_nta8o4 = true;
    var tmp = STRING_CASE_INSENSITIVE_ORDER$lambda;
    STRING_CASE_INSENSITIVE_ORDER = new sam$kotlin_Comparator$0(tmp);
  }
}
function regionMatches(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  return regionMatchesImpl(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase);
}
function AbstractCollection$toString$lambda(this$0) {
  return function (it) {
    return it === this$0 ? '(this Collection)' : toString_0(it);
  };
}
function AbstractCollection() {
}
protoOf(AbstractCollection).p = function (element) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.any' call
    var tmp;
    if (isInterface(this, Collection)) {
      tmp = this.o();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = false;
      break $l$block_0;
    }
    var _iterator__ex2g4s = this.j();
    while (_iterator__ex2g4s.k()) {
      var element_0 = _iterator__ex2g4s.l();
      if (equals(element_0, element)) {
        tmp$ret$0 = true;
        break $l$block_0;
      }
    }
    tmp$ret$0 = false;
  }
  return tmp$ret$0;
};
protoOf(AbstractCollection).u = function (elements) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(elements, Collection)) {
      tmp = elements.o();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = true;
      break $l$block_0;
    }
    var _iterator__ex2g4s = elements.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      if (!this.p(element)) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
};
protoOf(AbstractCollection).o = function () {
  return this.m() === 0;
};
protoOf(AbstractCollection).toString = function () {
  return joinToString_0(this, ', ', '[', ']', VOID, VOID, AbstractCollection$toString$lambda(this));
};
protoOf(AbstractCollection).toArray = function () {
  return collectionToArray(this);
};
function IteratorImpl_0($outer) {
  this.z5_1 = $outer;
  this.y5_1 = 0;
}
protoOf(IteratorImpl_0).k = function () {
  return this.y5_1 < this.z5_1.m();
};
protoOf(IteratorImpl_0).l = function () {
  if (!this.k())
    throw NoSuchElementException_init_$Create$();
  var _unary__edvuaz = this.y5_1;
  this.y5_1 = _unary__edvuaz + 1 | 0;
  return this.z5_1.n(_unary__edvuaz);
};
function ListIteratorImpl_0($outer, index) {
  this.c6_1 = $outer;
  IteratorImpl_0.call(this, $outer);
  Companion_instance_4.v1(index, this.c6_1.m());
  this.y5_1 = index;
}
function Companion_4() {
  this.j1_1 = 2147483639;
}
protoOf(Companion_4).c2 = function (index, size) {
  if (index < 0 || index >= size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_4).v1 = function (index, size) {
  if (index < 0 || index > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_4).k1 = function (fromIndex, toIndex, size) {
  if (fromIndex < 0 || toIndex > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('fromIndex: ' + fromIndex + ', toIndex: ' + toIndex + ', size: ' + size);
  }
  if (fromIndex > toIndex) {
    throw IllegalArgumentException_init_$Create$_0('fromIndex: ' + fromIndex + ' > toIndex: ' + toIndex);
  }
};
protoOf(Companion_4).p4 = function (startIndex, endIndex, size) {
  if (startIndex < 0 || endIndex > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('startIndex: ' + startIndex + ', endIndex: ' + endIndex + ', size: ' + size);
  }
  if (startIndex > endIndex) {
    throw IllegalArgumentException_init_$Create$_0('startIndex: ' + startIndex + ' > endIndex: ' + endIndex);
  }
};
protoOf(Companion_4).c3 = function (oldCapacity, minCapacity) {
  var newCapacity = oldCapacity + (oldCapacity >> 1) | 0;
  if ((newCapacity - minCapacity | 0) < 0)
    newCapacity = minCapacity;
  if ((newCapacity - 2147483639 | 0) > 0)
    newCapacity = minCapacity > 2147483639 ? 2147483647 : 2147483639;
  return newCapacity;
};
protoOf(Companion_4).f2 = function (c) {
  var hashCode = 1;
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var e = _iterator__ex2g4s.l();
    var tmp = imul_0(31, hashCode);
    var tmp1_elvis_lhs = e == null ? null : hashCode_0(e);
    hashCode = tmp + (tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs) | 0;
  }
  return hashCode;
};
protoOf(Companion_4).e2 = function (c, other) {
  if (!(c.m() === other.m()))
    return false;
  var otherIterator = other.j();
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var elem = _iterator__ex2g4s.l();
    var elemOther = otherIterator.l();
    if (!equals(elem, elemOther)) {
      return false;
    }
  }
  return true;
};
var Companion_instance_4;
function Companion_getInstance_4() {
  return Companion_instance_4;
}
function AbstractList() {
  AbstractCollection.call(this);
}
protoOf(AbstractList).j = function () {
  return new IteratorImpl_0(this);
};
protoOf(AbstractList).r = function (element) {
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.collections.indexOfFirst' call
    var index = 0;
    var _iterator__ex2g4s = this.j();
    while (_iterator__ex2g4s.k()) {
      var item = _iterator__ex2g4s.l();
      if (equals(item, element)) {
        tmp$ret$0 = index;
        break $l$block;
      }
      index = index + 1 | 0;
    }
    tmp$ret$0 = -1;
  }
  return tmp$ret$0;
};
protoOf(AbstractList).q = function (index) {
  return new ListIteratorImpl_0(this, index);
};
protoOf(AbstractList).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtList) : false))
    return false;
  return Companion_instance_4.e2(this, other);
};
protoOf(AbstractList).hashCode = function () {
  return Companion_instance_4.f2(this);
};
function Companion_5() {
}
protoOf(Companion_5).h2 = function (c) {
  var hashCode = 0;
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    var tmp = hashCode;
    var tmp1_elvis_lhs = element == null ? null : hashCode_0(element);
    hashCode = tmp + (tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs) | 0;
  }
  return hashCode;
};
protoOf(Companion_5).g2 = function (c, other) {
  if (!(c.m() === other.m()))
    return false;
  return c.u(other);
};
var Companion_instance_5;
function Companion_getInstance_5() {
  return Companion_instance_5;
}
function get_lastIndex_3(_this__u8e3s4) {
  return _this__u8e3s4.m() - 1 | 0;
}
function throwIndexOverflow() {
  throw ArithmeticException_init_$Create$_0('Index overflow has happened.');
}
function collectionToArrayCommonImpl(collection) {
  if (collection.o()) {
    // Inline function 'kotlin.emptyArray' call
    return [];
  }
  // Inline function 'kotlin.arrayOfNulls' call
  var size = collection.m();
  var destination = Array(size);
  var iterator = collection.j();
  var index = 0;
  while (iterator.k()) {
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    destination[_unary__edvuaz] = iterator.l();
  }
  return destination;
}
function listOf_0(elements) {
  return elements.length > 0 ? asList(elements) : emptyList();
}
function emptyList() {
  return EmptyList_getInstance();
}
function EmptyList() {
  EmptyList_instance = this;
  this.d6_1 = new Long(-1478467534, -1720727600);
}
protoOf(EmptyList).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtList) : false) {
    tmp = other.o();
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EmptyList).hashCode = function () {
  return 1;
};
protoOf(EmptyList).toString = function () {
  return '[]';
};
protoOf(EmptyList).m = function () {
  return 0;
};
protoOf(EmptyList).o = function () {
  return true;
};
protoOf(EmptyList).e6 = function (element) {
  return false;
};
protoOf(EmptyList).p = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.e6(tmp);
};
protoOf(EmptyList).n = function (index) {
  throw IndexOutOfBoundsException_init_$Create$_0("Empty list doesn't contain element at index " + index + '.');
};
protoOf(EmptyList).f6 = function (element) {
  return -1;
};
protoOf(EmptyList).r = function (element) {
  if (!false)
    return -1;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.f6(tmp);
};
protoOf(EmptyList).j = function () {
  return EmptyIterator_instance;
};
protoOf(EmptyList).q = function (index) {
  if (!(index === 0))
    throw IndexOutOfBoundsException_init_$Create$_0('Index: ' + index);
  return EmptyIterator_instance;
};
var EmptyList_instance;
function EmptyList_getInstance() {
  if (EmptyList_instance == null)
    new EmptyList();
  return EmptyList_instance;
}
function EmptyIterator() {
}
protoOf(EmptyIterator).k = function () {
  return false;
};
protoOf(EmptyIterator).l = function () {
  throw NoSuchElementException_init_$Create$();
};
var EmptyIterator_instance;
function EmptyIterator_getInstance() {
  return EmptyIterator_instance;
}
function optimizeReadOnlyList(_this__u8e3s4) {
  switch (_this__u8e3s4.m()) {
    case 0:
      return emptyList();
    case 1:
      return listOf(_this__u8e3s4.n(0));
    default:
      return _this__u8e3s4;
  }
}
function get_indices_1(_this__u8e3s4) {
  return numberRangeToNumber(0, _this__u8e3s4.m() - 1 | 0);
}
function IntIterator() {
}
protoOf(IntIterator).l = function () {
  return this.g6();
};
function TransformingSequence$iterator$1(this$0) {
  this.i6_1 = this$0;
  this.h6_1 = this$0.j6_1.j();
}
protoOf(TransformingSequence$iterator$1).l = function () {
  return this.i6_1.k6_1(this.h6_1.l());
};
protoOf(TransformingSequence$iterator$1).k = function () {
  return this.h6_1.k();
};
function TransformingSequence(sequence, transformer) {
  this.j6_1 = sequence;
  this.k6_1 = transformer;
}
protoOf(TransformingSequence).j = function () {
  return new TransformingSequence$iterator$1(this);
};
function setOf_0(elements) {
  return toSet(elements);
}
function emptySet() {
  return EmptySet_getInstance();
}
function hashSetOf(elements) {
  return toCollection(elements, HashSet_init_$Create$_0(mapCapacity(elements.length)));
}
function EmptySet() {
  EmptySet_instance = this;
  this.l6_1 = new Long(1993859828, 793161749);
}
protoOf(EmptySet).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtSet) : false) {
    tmp = other.o();
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EmptySet).hashCode = function () {
  return 0;
};
protoOf(EmptySet).toString = function () {
  return '[]';
};
protoOf(EmptySet).m = function () {
  return 0;
};
protoOf(EmptySet).o = function () {
  return true;
};
protoOf(EmptySet).e6 = function (element) {
  return false;
};
protoOf(EmptySet).p = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.e6(tmp);
};
protoOf(EmptySet).m6 = function (elements) {
  return elements.o();
};
protoOf(EmptySet).u = function (elements) {
  return this.m6(elements);
};
protoOf(EmptySet).j = function () {
  return EmptyIterator_instance;
};
var EmptySet_instance;
function EmptySet_getInstance() {
  if (EmptySet_instance == null)
    new EmptySet();
  return EmptySet_instance;
}
function optimizeReadOnlySet(_this__u8e3s4) {
  switch (_this__u8e3s4.m()) {
    case 0:
      return emptySet();
    case 1:
      return setOf(_this__u8e3s4.j().l());
    default:
      return _this__u8e3s4;
  }
}
function naturalOrder() {
  var tmp = NaturalOrderComparator_instance;
  return isInterface(tmp, Comparator) ? tmp : THROW_CCE();
}
function NaturalOrderComparator() {
}
protoOf(NaturalOrderComparator).n6 = function (a, b) {
  return compareTo(a, b);
};
protoOf(NaturalOrderComparator).compare = function (a, b) {
  var tmp = (!(a == null) ? isComparable(a) : false) ? a : THROW_CCE();
  return this.n6(tmp, (!(b == null) ? isComparable(b) : false) ? b : THROW_CCE());
};
var NaturalOrderComparator_instance;
function NaturalOrderComparator_getInstance() {
  return NaturalOrderComparator_instance;
}
function EnumEntriesList(entries) {
  AbstractList.call(this);
  this.o6_1 = entries;
}
protoOf(EnumEntriesList).m = function () {
  return this.o6_1.length;
};
protoOf(EnumEntriesList).n = function (index) {
  Companion_instance_4.c2(index, this.o6_1.length);
  return this.o6_1[index];
};
protoOf(EnumEntriesList).p6 = function (element) {
  if (element === null)
    return false;
  var target = getOrNull(this.o6_1, element.z_1);
  return target === element;
};
protoOf(EnumEntriesList).p = function (element) {
  if (!(element instanceof Enum))
    return false;
  return this.p6(element instanceof Enum ? element : THROW_CCE());
};
protoOf(EnumEntriesList).q6 = function (element) {
  if (element === null)
    return -1;
  var ordinal = element.z_1;
  var target = getOrNull(this.o6_1, ordinal);
  return target === element ? ordinal : -1;
};
protoOf(EnumEntriesList).r = function (element) {
  if (!(element instanceof Enum))
    return -1;
  return this.q6(element instanceof Enum ? element : THROW_CCE());
};
function enumEntries(entries) {
  return new EnumEntriesList(entries);
}
function getProgressionLastElement(start, end, step) {
  var tmp;
  if (step > 0) {
    tmp = start >= end ? end : end - differenceModulo(end, start, step) | 0;
  } else if (step < 0) {
    tmp = start <= end ? end : end + differenceModulo(start, end, -step | 0) | 0;
  } else {
    throw IllegalArgumentException_init_$Create$_0('Step is zero.');
  }
  return tmp;
}
function differenceModulo(a, b, c) {
  return mod(mod(a, c) - mod(b, c) | 0, c);
}
function mod(a, b) {
  var mod = a % b | 0;
  return mod >= 0 ? mod : mod + b | 0;
}
function Default() {
  Default_instance = this;
  Random.call(this);
  this.r6_1 = defaultPlatformRandom();
}
protoOf(Default).s6 = function (bitCount) {
  return this.r6_1.s6(bitCount);
};
protoOf(Default).t6 = function () {
  return this.r6_1.t6();
};
var Default_instance;
function Default_getInstance() {
  if (Default_instance == null)
    new Default();
  return Default_instance;
}
function Random() {
  Default_getInstance();
}
protoOf(Random).t6 = function () {
  return doubleFromParts(this.s6(26), this.s6(27));
};
function Random_0(seed) {
  return XorWowRandom_init_$Create$(seed, seed >> 31);
}
function takeUpperBits(_this__u8e3s4, bitCount) {
  return (_this__u8e3s4 >>> (32 - bitCount | 0) | 0) & (-bitCount | 0) >> 31;
}
function XorWowRandom_init_$Init$(seed1, seed2, $this) {
  XorWowRandom.call($this, seed1, seed2, 0, 0, ~seed1, seed1 << 10 ^ (seed2 >>> 4 | 0));
  return $this;
}
function XorWowRandom_init_$Create$(seed1, seed2) {
  return XorWowRandom_init_$Init$(seed1, seed2, objectCreate(protoOf(XorWowRandom)));
}
function checkInvariants($this) {
  // Inline function 'kotlin.require' call
  if (!!(($this.u6_1 | $this.v6_1 | $this.w6_1 | $this.x6_1 | $this.y6_1) === 0)) {
    var message = 'Initial state must have at least one non-zero element.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
}
function Companion_6() {
  Companion_instance_6 = this;
  this.a7_1 = new Long(0, 0);
}
var Companion_instance_6;
function Companion_getInstance_6() {
  if (Companion_instance_6 == null) {
    Default_getInstance();
    new Companion_6();
  }
  return Companion_instance_6;
}
function XorWowRandom(x, y, z, w, v, addend) {
  Companion_getInstance_6();
  Random.call(this);
  this.u6_1 = x;
  this.v6_1 = y;
  this.w6_1 = z;
  this.x6_1 = w;
  this.y6_1 = v;
  this.z6_1 = addend;
  checkInvariants(this);
  // Inline function 'kotlin.repeat' call
  var inductionVariable = 0;
  if (inductionVariable < 64)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      this.g6();
    }
     while (inductionVariable < 64);
}
protoOf(XorWowRandom).g6 = function () {
  var t = this.u6_1;
  t = t ^ (t >>> 2 | 0);
  this.u6_1 = this.v6_1;
  this.v6_1 = this.w6_1;
  this.w6_1 = this.x6_1;
  var v0 = this.y6_1;
  this.x6_1 = v0;
  t = t ^ t << 1 ^ v0 ^ v0 << 4;
  this.y6_1 = t;
  this.z6_1 = this.z6_1 + 362437 | 0;
  return t + this.z6_1 | 0;
};
protoOf(XorWowRandom).s6 = function (bitCount) {
  return takeUpperBits(this.g6(), bitCount);
};
function Companion_7() {
  Companion_instance_7 = this;
  this.b7_1 = new IntRange(1, 0);
}
var Companion_instance_7;
function Companion_getInstance_7() {
  if (Companion_instance_7 == null) {
    Companion_instance_8;
    new Companion_7();
  }
  return Companion_instance_7;
}
function IntRange(start, endInclusive) {
  Companion_getInstance_7();
  IntProgression.call(this, start, endInclusive, 1);
}
protoOf(IntRange).f5 = function () {
  return this.c7_1;
};
protoOf(IntRange).g5 = function () {
  return this.d7_1;
};
protoOf(IntRange).f7 = function () {
  if (this.d7_1 === 2147483647) {
    // Inline function 'kotlin.error' call
    var message = 'Cannot return the exclusive upper bound of a range that includes MAX_VALUE.';
    throw IllegalStateException_init_$Create$_0(toString_1(message));
  }
  return this.d7_1 + 1 | 0;
};
protoOf(IntRange).g7 = function (value) {
  return this.c7_1 <= value && value <= this.d7_1;
};
protoOf(IntRange).h7 = function (value) {
  return this.g7(typeof value === 'number' ? value : THROW_CCE());
};
protoOf(IntRange).o = function () {
  return this.c7_1 > this.d7_1;
};
protoOf(IntRange).equals = function (other) {
  var tmp;
  if (other instanceof IntRange) {
    tmp = this.o() && other.o() || (this.c7_1 === other.c7_1 && this.d7_1 === other.d7_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntRange).hashCode = function () {
  return this.o() ? -1 : imul_0(31, this.c7_1) + this.d7_1 | 0;
};
protoOf(IntRange).toString = function () {
  return '' + this.c7_1 + '..' + this.d7_1;
};
function IntProgressionIterator(first, last, step) {
  IntIterator.call(this);
  this.i7_1 = step;
  this.j7_1 = last;
  this.k7_1 = this.i7_1 > 0 ? first <= last : first >= last;
  this.l7_1 = this.k7_1 ? first : this.j7_1;
}
protoOf(IntProgressionIterator).k = function () {
  return this.k7_1;
};
protoOf(IntProgressionIterator).g6 = function () {
  var value = this.l7_1;
  if (value === this.j7_1) {
    if (!this.k7_1)
      throw NoSuchElementException_init_$Create$();
    this.k7_1 = false;
  } else {
    this.l7_1 = this.l7_1 + this.i7_1 | 0;
  }
  return value;
};
function Companion_8() {
}
protoOf(Companion_8).t = function (rangeStart, rangeEnd, step) {
  return new IntProgression(rangeStart, rangeEnd, step);
};
var Companion_instance_8;
function Companion_getInstance_8() {
  return Companion_instance_8;
}
function IntProgression(start, endInclusive, step) {
  if (step === 0)
    throw IllegalArgumentException_init_$Create$_0('Step must be non-zero.');
  if (step === -2147483648)
    throw IllegalArgumentException_init_$Create$_0('Step must be greater than Int.MIN_VALUE to avoid overflow on negation.');
  this.c7_1 = start;
  this.d7_1 = getProgressionLastElement(start, endInclusive, step);
  this.e7_1 = step;
}
protoOf(IntProgression).j = function () {
  return new IntProgressionIterator(this.c7_1, this.d7_1, this.e7_1);
};
protoOf(IntProgression).o = function () {
  return this.e7_1 > 0 ? this.c7_1 > this.d7_1 : this.c7_1 < this.d7_1;
};
protoOf(IntProgression).equals = function (other) {
  var tmp;
  if (other instanceof IntProgression) {
    tmp = this.o() && other.o() || (this.c7_1 === other.c7_1 && this.d7_1 === other.d7_1 && this.e7_1 === other.e7_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntProgression).hashCode = function () {
  return this.o() ? -1 : imul_0(31, imul_0(31, this.c7_1) + this.d7_1 | 0) + this.e7_1 | 0;
};
protoOf(IntProgression).toString = function () {
  return this.e7_1 > 0 ? '' + this.c7_1 + '..' + this.d7_1 + ' step ' + this.e7_1 : '' + this.c7_1 + ' downTo ' + this.d7_1 + ' step ' + (-this.e7_1 | 0);
};
function OpenEndRange() {
}
function rangeUntil(_this__u8e3s4, that) {
  return new OpenEndFloatRange(_this__u8e3s4, that);
}
function OpenEndFloatRange(start, endExclusive) {
  this.m7_1 = start;
  this.n7_1 = endExclusive;
}
protoOf(OpenEndFloatRange).f5 = function () {
  return this.m7_1;
};
protoOf(OpenEndFloatRange).f7 = function () {
  return this.n7_1;
};
protoOf(OpenEndFloatRange).o7 = function (value) {
  return value >= this.m7_1 && value < this.n7_1;
};
protoOf(OpenEndFloatRange).h7 = function (value) {
  return this.o7(typeof value === 'number' ? value : THROW_CCE());
};
protoOf(OpenEndFloatRange).o = function () {
  return !(this.m7_1 < this.n7_1);
};
protoOf(OpenEndFloatRange).equals = function (other) {
  var tmp;
  if (other instanceof OpenEndFloatRange) {
    tmp = this.o() && other.o() || (this.m7_1 === other.m7_1 && this.n7_1 === other.n7_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(OpenEndFloatRange).hashCode = function () {
  return this.o() ? -1 : imul_0(31, getNumberHashCode(this.m7_1)) + getNumberHashCode(this.n7_1) | 0;
};
protoOf(OpenEndFloatRange).toString = function () {
  return '' + this.m7_1 + '..<' + this.n7_1;
};
function appendElement(_this__u8e3s4, element, transform) {
  if (!(transform == null))
    _this__u8e3s4.e(transform(element));
  else {
    if (element == null ? true : isCharSequence(element))
      _this__u8e3s4.e(element);
    else {
      if (element instanceof Char)
        _this__u8e3s4.c4(element.p7_1);
      else {
        _this__u8e3s4.e(toString_1(element));
      }
    }
  }
}
function equals_0(_this__u8e3s4, other, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  if (_this__u8e3s4 === other)
    return true;
  if (!ignoreCase)
    return false;
  var thisUpper = uppercaseChar(_this__u8e3s4);
  var otherUpper = uppercaseChar(other);
  var tmp;
  if (thisUpper === otherUpper) {
    tmp = true;
  } else {
    // Inline function 'kotlin.text.lowercaseChar' call
    // Inline function 'kotlin.text.lowercase' call
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var tmp$ret$1 = toString(thisUpper).toLowerCase();
    var tmp_0 = charCodeAt(tmp$ret$1, 0);
    // Inline function 'kotlin.text.lowercaseChar' call
    // Inline function 'kotlin.text.lowercase' call
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var tmp$ret$5 = toString(otherUpper).toLowerCase();
    tmp = tmp_0 === charCodeAt(tmp$ret$5, 0);
  }
  return tmp;
}
function toIntOrNull(_this__u8e3s4) {
  return toIntOrNull_0(_this__u8e3s4, 10);
}
function toIntOrNull_0(_this__u8e3s4, radix) {
  checkRadix(radix);
  var length = _this__u8e3s4.length;
  if (length === 0)
    return null;
  var start;
  var isNegative;
  var limit;
  var firstChar = charCodeAt(_this__u8e3s4, 0);
  if (Char__compareTo_impl_ypi4mb(firstChar, _Char___init__impl__6a9atx(48)) < 0) {
    if (length === 1)
      return null;
    start = 1;
    if (firstChar === _Char___init__impl__6a9atx(45)) {
      isNegative = true;
      limit = -2147483648;
    } else if (firstChar === _Char___init__impl__6a9atx(43)) {
      isNegative = false;
      limit = -2147483647;
    } else
      return null;
  } else {
    start = 0;
    isNegative = false;
    limit = -2147483647;
  }
  var limitForMaxRadix = -59652323;
  var limitBeforeMul = limitForMaxRadix;
  var result = 0;
  var inductionVariable = start;
  if (inductionVariable < length)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var digit = digitOf(charCodeAt(_this__u8e3s4, i), radix);
      if (digit < 0)
        return null;
      if (result < limitBeforeMul) {
        if (limitBeforeMul === limitForMaxRadix) {
          limitBeforeMul = limit / radix | 0;
          if (result < limitBeforeMul) {
            return null;
          }
        } else {
          return null;
        }
      }
      result = imul_0(result, radix);
      if (result < (limit + digit | 0))
        return null;
      result = result - digit | 0;
    }
     while (inductionVariable < length);
  return isNegative ? result : -result | 0;
}
function contains_1(_this__u8e3s4, other, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  var tmp;
  if (typeof other === 'string') {
    tmp = indexOf_1(_this__u8e3s4, other, VOID, ignoreCase) >= 0;
  } else {
    tmp = indexOf_2(_this__u8e3s4, other, 0, charSequenceLength(_this__u8e3s4), ignoreCase) >= 0;
  }
  return tmp;
}
function padStart(_this__u8e3s4, length, padChar) {
  padChar = padChar === VOID ? _Char___init__impl__6a9atx(32) : padChar;
  return toString_1(padStart_0(isCharSequence(_this__u8e3s4) ? _this__u8e3s4 : THROW_CCE(), length, padChar));
}
function indexOf_1(_this__u8e3s4, string, startIndex, ignoreCase) {
  startIndex = startIndex === VOID ? 0 : startIndex;
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  var tmp;
  var tmp_0;
  if (ignoreCase) {
    tmp_0 = true;
  } else {
    tmp_0 = !(typeof _this__u8e3s4 === 'string');
  }
  if (tmp_0) {
    tmp = indexOf_2(_this__u8e3s4, string, startIndex, charSequenceLength(_this__u8e3s4), ignoreCase);
  } else {
    // Inline function 'kotlin.text.nativeIndexOf' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = _this__u8e3s4.indexOf(string, startIndex);
  }
  return tmp;
}
function indexOf_2(_this__u8e3s4, other, startIndex, endIndex, ignoreCase, last) {
  last = last === VOID ? false : last;
  var indices = !last ? numberRangeToNumber(coerceAtLeast(startIndex, 0), coerceAtMost(endIndex, charSequenceLength(_this__u8e3s4))) : downTo(coerceAtMost(startIndex, get_lastIndex_4(_this__u8e3s4)), coerceAtLeast(endIndex, 0));
  var tmp;
  if (typeof _this__u8e3s4 === 'string') {
    tmp = typeof other === 'string';
  } else {
    tmp = false;
  }
  if (tmp) {
    var inductionVariable = indices.c7_1;
    var last_0 = indices.d7_1;
    var step = indices.e7_1;
    if (step > 0 && inductionVariable <= last_0 || (step < 0 && last_0 <= inductionVariable))
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + step | 0;
        if (regionMatches(other, 0, _this__u8e3s4, index, other.length, ignoreCase))
          return index;
      }
       while (!(index === last_0));
  } else {
    var inductionVariable_0 = indices.c7_1;
    var last_1 = indices.d7_1;
    var step_0 = indices.e7_1;
    if (step_0 > 0 && inductionVariable_0 <= last_1 || (step_0 < 0 && last_1 <= inductionVariable_0))
      do {
        var index_0 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + step_0 | 0;
        if (regionMatchesImpl(other, 0, _this__u8e3s4, index_0, charSequenceLength(other), ignoreCase))
          return index_0;
      }
       while (!(index_0 === last_1));
  }
  return -1;
}
function isBlank(_this__u8e3s4) {
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.text.all' call
    var inductionVariable = 0;
    while (inductionVariable < charSequenceLength(_this__u8e3s4)) {
      var element = charSequenceGet(_this__u8e3s4, inductionVariable);
      inductionVariable = inductionVariable + 1 | 0;
      if (!isWhitespace(element)) {
        tmp$ret$0 = false;
        break $l$block;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
}
function padStart_0(_this__u8e3s4, length, padChar) {
  padChar = padChar === VOID ? _Char___init__impl__6a9atx(32) : padChar;
  if (length < 0)
    throw IllegalArgumentException_init_$Create$_0('Desired length ' + length + ' is less than zero.');
  if (length <= charSequenceLength(_this__u8e3s4))
    return charSequenceSubSequence(_this__u8e3s4, 0, charSequenceLength(_this__u8e3s4));
  var sb = StringBuilder_init_$Create$(length);
  var inductionVariable = 1;
  var last = length - charSequenceLength(_this__u8e3s4) | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      sb.c4(padChar);
    }
     while (!(i === last));
  sb.e(_this__u8e3s4);
  return sb;
}
function get_lastIndex_4(_this__u8e3s4) {
  return charSequenceLength(_this__u8e3s4) - 1 | 0;
}
function regionMatchesImpl(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase) {
  if (otherOffset < 0 || thisOffset < 0 || thisOffset > (charSequenceLength(_this__u8e3s4) - length | 0) || otherOffset > (charSequenceLength(other) - length | 0)) {
    return false;
  }
  var inductionVariable = 0;
  if (inductionVariable < length)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (!equals_0(charSequenceGet(_this__u8e3s4, thisOffset + index | 0), charSequenceGet(other, otherOffset + index | 0), ignoreCase))
        return false;
    }
     while (inductionVariable < length);
  return true;
}
function Pair(first, second) {
  this.q7_1 = first;
  this.r7_1 = second;
}
protoOf(Pair).toString = function () {
  return '(' + toString_0(this.q7_1) + ', ' + toString_0(this.r7_1) + ')';
};
protoOf(Pair).s7 = function () {
  return this.q7_1;
};
protoOf(Pair).t7 = function () {
  return this.r7_1;
};
protoOf(Pair).hashCode = function () {
  var result = this.q7_1 == null ? 0 : hashCode_0(this.q7_1);
  result = imul_0(result, 31) + (this.r7_1 == null ? 0 : hashCode_0(this.r7_1)) | 0;
  return result;
};
protoOf(Pair).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof Pair))
    return false;
  if (!equals(this.q7_1, other.q7_1))
    return false;
  if (!equals(this.r7_1, other.r7_1))
    return false;
  return true;
};
function to(_this__u8e3s4, that) {
  return new Pair(_this__u8e3s4, that);
}
function BuildUpModel() {
  BuildUpModel_instance = this;
  this.u7_1 = listOf_0(['posSub', 'posFull', 'jump', 'airRise', 'presRise', 'noiseRise', 'centRise', 'snareRatio', 'subDelta', 'airPos', 'presPos', 'level', 'posSub_d2', 'posFull_d2', 'jump_d2', 'airRise_d2', 'presRise_d2', 'noiseRise_d2', 'centRise_d2', 'snareRatio_d2', 'subDelta_d2', 'airPos_d2', 'presPos_d2', 'level_d2', 'posSub_d4', 'posFull_d4', 'jump_d4', 'airRise_d4', 'presRise_d4', 'noiseRise_d4', 'centRise_d4', 'snareRatio_d4', 'subDelta_d4', 'airPos_d4', 'presPos_d4', 'level_d4', 'posSub_d8', 'posFull_d8', 'jump_d8', 'airRise_d8', 'presRise_d8', 'noiseRise_d8', 'centRise_d8', 'snareRatio_d8', 'subDelta_d8', 'airPos_d8', 'presPos_d8', 'level_d8']);
  var tmp = this;
  // Inline function 'kotlin.floatArrayOf' call
  tmp.v7_1 = new Float32Array([0.604989, 0.369052, -0.02255, 0.003546, 0.001263, -0.007736, -0.004343, 0.452479, -0.002574, 0.514553, 0.625993, 0.518606, -0.003532, -0.002178, -0.001745, -0.001503, -0.002013, -7.04E-4, -5.58E-4, -0.002329, 3.96E-4, 6.61E-4, 7.94E-4, -6.78E-4, -0.006615, -0.004224, -0.002577, -0.002605, -0.003841, -0.001394, -2.47E-4, -0.005382, 0.002192, 0.00123, 0.001718, -0.001286, -0.016774, -0.011043, -0.004556, -0.005963, -0.00815, -0.004558, -0.001358, -0.011245, 0.004781, 0.001807, 0.003624, -0.002904]);
  var tmp_0 = this;
  // Inline function 'kotlin.floatArrayOf' call
  tmp_0.w7_1 = new Float32Array([0.394031, 0.357661, 0.302211, 0.36988, 0.258595, 0.27917, 0.300725, 0.617616, 0.335287, 0.385349, 0.378248, 0.192611, 0.319914, 0.292111, 0.392444, 0.516163, 0.347128, 0.329272, 0.37019, 0.659531, 0.425802, 0.346967, 0.253352, 0.140057, 0.402007, 0.35692, 0.470245, 0.596473, 0.396527, 0.413966, 0.479737, 0.888308, 0.518502, 0.396295, 0.29835, 0.159635, 0.485649, 0.421951, 0.445867, 0.520429, 0.375824, 0.397813, 0.435999, 0.805177, 0.498481, 0.428594, 0.356629, 0.185601]);
  var tmp_1 = this;
  // Inline function 'kotlin.floatArrayOf' call
  tmp_1.x7_1 = new Float32Array([-0.826653, 0.008891, -0.060809, -0.085557, -0.157477, 0.070622, 0.072187, -0.019927, -0.006541, 0.304405, 0.964466, 0.004674, 0.14275, 0.058845, 0.039833, 0.017909, 0.093826, 0.013872, -0.078482, 0.040577, 0.019899, -0.092206, -0.059928, 0.04055, 0.094969, 0.053813, -0.011901, 0.023786, -0.033167, -0.024431, -0.114357, -0.021872, -0.013206, -0.045642, -0.15108, 0.049685, 0.085348, 0.057163, -0.1171, -0.019614, -0.137129, 0.045559, -0.056692, 0.179557, 0.043623, -0.00339, -0.183923, 0.18365]);
  this.y7_1 = -0.656804;
}
protoOf(BuildUpModel).z7 = function (x, i) {
  return this.x7_1[i] * (x[i] - this.v7_1[i]) / this.w7_1[i];
};
protoOf(BuildUpModel).a8 = function () {
  return -0.656804;
};
protoOf(BuildUpModel).m = function () {
  return this.x7_1.length;
};
protoOf(BuildUpModel).b8 = function (x) {
  var z = -0.656804;
  var inductionVariable = 0;
  var last = this.x7_1.length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      z = z + this.x7_1[i] * (x[i] - this.v7_1[i]) / this.w7_1[i];
    }
     while (inductionVariable <= last);
  // Inline function 'kotlin.math.exp' call
  var x_0 = -z;
  return 1.0 / (1.0 + Math.exp(x_0));
};
var BuildUpModel_instance;
function BuildUpModel_getInstance() {
  if (BuildUpModel_instance == null)
    new BuildUpModel();
  return BuildUpModel_instance;
}
function BeatClock() {
  this.c8_1 = -1.0;
  this.d8_1 = new Long(0, 0);
  this.e8_1 = false;
}
protoOf(BeatClock).f8 = function () {
  this.c8_1 = -1.0;
  this.d8_1 = new Long(0, 0);
  this.e8_1 = false;
};
protoOf(BeatClock).g8 = function (f, now, leadMs, halfTime, decayMs) {
  var beatP = f.d9_1;
  this.e8_1 = (f.e9_1 >= 3 && beatP > 0.0 && compare(f.c9_1, new Long(0, 0)) > 0 && toNumber(subtract(now, f.c9_1)) < beatP * 1.6);
  if (!this.e8_1) {
    this.c8_1 = -1.0;
    return null;
  }
  var p = halfTime ? beatP * 2.0 : beatP;
  var anchor = halfTime ? subtract(f.c9_1, multiply(numberToLong(f.b9_1 % 2 | 0), numberToLong(beatP))) : f.c9_1;
  // Inline function 'kotlin.Long.plus' call
  var since = ((toNumber(now) + leadMs - toNumber(anchor)) % p + p) % p;
  if (this.c8_1 >= 0.0 && since < this.c8_1 && toNumber(subtract(now, this.d8_1)) > p * 0.6)
    this.d8_1 = now;
  this.c8_1 = since;
  // Inline function 'kotlin.Long.div' call
  var this_0 = negate(subtract(now, this.d8_1));
  // Inline function 'kotlin.math.exp' call
  var x = toNumber(this_0) / decayMs;
  return Math.exp(x);
};
protoOf(BeatClock).k9 = function (f, now, leadMs, halfTime, decayMs, $super) {
  leadMs = leadMs === VOID ? 70.0 : leadMs;
  halfTime = halfTime === VOID ? false : halfTime;
  decayMs = decayMs === VOID ? 85.0 : decayMs;
  return $super === VOID ? this.g8(f, now, leadMs, halfTime, decayMs) : $super.g8.call(this, f, now, leadMs, halfTime, decayMs);
};
function FlashBudget() {
  this.l9_1 = longArray(3);
}
protoOf(FlashBudget).m9 = function (now) {
  var tmp0 = this.l9_1;
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.collections.any' call
    var inductionVariable = 0;
    var last = tmp0.length;
    while (inductionVariable < last) {
      var element = tmp0[inductionVariable];
      inductionVariable = inductionVariable + 1 | 0;
      if (compare(subtract(now, element), new Long(250, 0)) < 0) {
        tmp$ret$0 = true;
        break $l$block;
      }
    }
    tmp$ret$0 = false;
  }
  if (tmp$ret$0)
    return false;
  var tmp0_0 = get_indices_0(this.l9_1);
  var tmp$ret$2;
  $l$block_0: {
    // Inline function 'kotlin.collections.minBy' call
    var iterator = tmp0_0.j();
    if (!iterator.k())
      throw NoSuchElementException_init_$Create$();
    var minElem = iterator.l();
    if (!iterator.k()) {
      tmp$ret$2 = minElem;
      break $l$block_0;
    }
    var it = minElem;
    var minValue = this.l9_1[it];
    do {
      var e = iterator.l();
      var v = this.l9_1[e];
      if (compareTo(minValue, v) > 0) {
        minElem = e;
        minValue = v;
      }
    }
     while (iterator.k());
    tmp$ret$2 = minElem;
  }
  var oldest = tmp$ret$2;
  if (compare(subtract(now, this.l9_1[oldest]), new Long(1000, 0)) < 0)
    return false;
  this.l9_1[oldest] = now;
  return true;
};
protoOf(FlashBudget).n9 = function (now) {
  // Inline function 'kotlin.collections.count' call
  var count = 0;
  var indexedObject = this.l9_1;
  var inductionVariable = 0;
  var last = indexedObject.length;
  while (inductionVariable < last) {
    var element = indexedObject[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    if (compare(element, new Long(0, 0)) > 0 && compare(subtract(now, element), new Long(1000, 0)) < 0) {
      count = count + 1 | 0;
    }
  }
  return count;
};
function get_CALM_LOCK() {
  _init_properties_GenreDetector_kt__z0odbr();
  return CALM_LOCK;
}
var CALM_LOCK;
var static_init_called;
function static_init() {
  if (static_init_called)
    return Unit_instance;
  static_init_called = true;
  Genre_HARDSTYLE_instance = new Genre('HARDSTYLE', 0, 'HARDSTYLE');
  Genre_RAP_instance = new Genre('RAP', 1, 'RAP');
  Genre_ROCK_instance = new Genre('ROCK', 2, 'ROCK');
  Genre_EDM_instance = new Genre('EDM', 3, 'EDM');
  Genre_STANDARD_instance = new Genre('STANDARD', 4, 'ROLIG');
  Genre_POP_instance = new Genre('POP', 5, 'POP');
  Genre_REGGAE_instance = new Genre('REGGAE', 6, 'REGGAE');
  Genre_REGGAETON_instance = new Genre('REGGAETON', 7, 'REGGAETON');
}
var Genre_HARDSTYLE_instance;
var Genre_RAP_instance;
var Genre_ROCK_instance;
var Genre_EDM_instance;
var Genre_STANDARD_instance;
var Genre_POP_instance;
var Genre_REGGAE_instance;
var Genre_REGGAETON_instance;
function values() {
  static_init();
  return [Genre_HARDSTYLE_getInstance(), Genre_RAP_getInstance(), Genre_ROCK_getInstance(), Genre_EDM_getInstance(), Genre_STANDARD_getInstance(), Genre_POP_getInstance(), Genre_REGGAE_getInstance(), Genre_REGGAETON_getInstance()];
}
function get_entries() {
  static_init();
  if ($ENTRIES == null)
    $ENTRIES = enumEntries(values());
  return $ENTRIES;
}
var $ENTRIES;
function Genre(name, ordinal, label) {
  Enum.call(this, name, ordinal);
  this.q9_1 = label;
}
function PartyProfile(spike, particles, shake, strobe, density, softness) {
  density = density === VOID ? 1.0 : density;
  softness = softness === VOID ? 1.0 : softness;
  this.r9_1 = spike;
  this.s9_1 = particles;
  this.t9_1 = shake;
  this.u9_1 = strobe;
  this.v9_1 = density;
  this.w9_1 = softness;
}
protoOf(PartyProfile).toString = function () {
  return 'PartyProfile(spike=' + this.r9_1 + ', particles=' + this.s9_1 + ', shake=' + this.t9_1 + ', strobe=' + this.u9_1 + ', density=' + this.v9_1 + ', softness=' + this.w9_1 + ')';
};
protoOf(PartyProfile).hashCode = function () {
  var result = getNumberHashCode(this.r9_1);
  result = imul_0(result, 31) + getNumberHashCode(this.s9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.t9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.u9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.v9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.w9_1) | 0;
  return result;
};
protoOf(PartyProfile).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof PartyProfile))
    return false;
  if (!equals(this.r9_1, other.r9_1))
    return false;
  if (!equals(this.s9_1, other.s9_1))
    return false;
  if (!equals(this.t9_1, other.t9_1))
    return false;
  if (!equals(this.u9_1, other.u9_1))
    return false;
  if (!equals(this.v9_1, other.v9_1))
    return false;
  if (!equals(this.w9_1, other.w9_1))
    return false;
  return true;
};
function profile(_this__u8e3s4) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  switch (_this__u8e3s4.z_1) {
    case 0:
      tmp = new PartyProfile(1.15, 1.15, 1.35, 1.0);
      break;
    case 1:
      tmp = new PartyProfile(0.75, 0.35, 0.35, 0.0, 0.35, 2.4);
      break;
    case 2:
      tmp = new PartyProfile(1.0, 1.0, 1.0, 0.8);
      break;
    case 3:
      tmp = new PartyProfile(1.0, 1.0, 0.8, 0.9);
      break;
    case 4:
      tmp = new PartyProfile(0.6, 0.7, 0.0, 0.0);
      break;
    case 5:
    case 6:
    case 7:
      tmp = new PartyProfile(0.65, 0.6, 0.0, 0.0, 0.6, 1.6);
      break;
    default:
      noWhenBranchMatchedException();
      break;
  }
  return tmp;
}
function shape(_this__u8e3s4, f) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  switch (_this__u8e3s4.z_1) {
    case 0:
      tmp = f;
      break;
    case 1:
      var strong = coerceIn_0((f.h8_1 - 0.6) / 0.3, 0.0, 1.0) * coerceAtMost_0(0.5 + f.u8_1, 1.0);
      var tmp1_kick = f.i8_1 * strong;
      var tmp2_heavy = strong * strong * 0.6;
      var tmp3_bass = f.h8_1 * 0.9;
      var tmp4_grit = f.u8_1 > 0.55 && strong > 0.6 ? 1.0 : 0.0;
      tmp = f.x9(tmp3_bass, tmp1_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp2_heavy, tmp4_grit);
      break;
    case 2:
      var tmp0 = f.s8_1;
      // Inline function 'kotlin.math.max' call

      var b = f.i8_1 * 0.6;
      var tmp5_kick = Math.max(tmp0, b);
      var tmp6_heavy = coerceAtMost_0(f.s8_1 * 0.6 + f.q8_1 * 0.4, 1.0);
      var tmp0_0 = f.h8_1 * 0.7;
      // Inline function 'kotlin.math.max' call

      var b_0 = f.s8_1;
      var tmp7_bass = Math.max(tmp0_0, b_0);
      var tmp8_grit = f.s8_1 > 0.7 ? 1.0 : 0.0;
      tmp = f.x9(tmp7_bass, tmp5_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp6_heavy, tmp8_grit);
      break;
    case 3:
      var tmp0_1 = f.p8_1;
      // Inline function 'kotlin.math.max' call

      var b_1 = f.k8_1 * 0.6 * f.i8_1;
      var tmp$ret$2 = Math.max(tmp0_1, b_1);
      tmp = f.x9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, tmp$ret$2, f.p8_1 > 0.3 ? 1.0 : 0.0);
      break;
    case 4:
      var tmp9_kick = f.i8_1 * 0.5;
      tmp = f.x9(VOID, tmp9_kick, VOID, VOID, VOID, VOID, VOID, VOID, 0.0, 0.0);
      break;
    case 5:
    case 6:
    case 7:
      var tmp10_kick = f.i8_1 * 0.6;
      tmp = f.x9(VOID, tmp10_kick, VOID, VOID, VOID, VOID, VOID, VOID, 0.0, 0.0);
      break;
    default:
      noWhenBranchMatchedException();
      break;
  }
  return tmp;
}
function blendFrames(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return b.x9(blendFrames$l(t, a.h8_1, b.h8_1), blendFrames$l(t, a.i8_1, b.i8_1), VOID, VOID, VOID, VOID, VOID, VOID, blendFrames$l(t, a.p8_1, b.p8_1), blendFrames$l(t, a.q8_1, b.q8_1));
}
function vibeTarget(_this__u8e3s4) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  switch (_this__u8e3s4.z_1) {
    case 4:
      tmp = 0.0;
      break;
    case 5:
    case 6:
    case 7:
      tmp = 0.1;
      break;
    case 1:
      tmp = 0.25;
      break;
    case 3:
      tmp = 0.5;
      break;
    case 0:
    case 2:
      tmp = 1.0;
      break;
    default:
      noWhenBranchMatchedException();
      break;
  }
  return tmp;
}
function hardWeight(v) {
  _init_properties_GenreDetector_kt__z0odbr();
  return coerceIn_0((v - 0.5) / 0.5, 0.0, 1.0);
}
function structureWeight(v) {
  _init_properties_GenreDetector_kt__z0odbr();
  return coerceIn_0((v - 0.25) / 0.25, 0.0, 1.0);
}
function lerpF(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return a + (b - a) * t;
}
function lerpProfile(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return new PartyProfile(lerpF(a.r9_1, b.r9_1, t), lerpF(a.s9_1, b.s9_1, t), lerpF(a.t9_1, b.t9_1, t), lerpF(a.u9_1, b.u9_1, t), lerpF(a.v9_1, b.v9_1, t), lerpF(a.w9_1, b.w9_1, t));
}
function hardFusion(f, rockness) {
  _init_properties_GenreDetector_kt__z0odbr();
  var rock = shape(Genre_ROCK_getInstance(), f);
  var edm = shape(Genre_EDM_getInstance(), f);
  var tmp0 = f.i8_1;
  // Inline function 'kotlin.math.max' call
  var b = rock.i8_1;
  var tmp0_kick = Math.max(tmp0, b);
  var tmp0_0 = f.p8_1;
  var tmp2 = rock.p8_1;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = edm.p8_1;
  var tmp1_heavy = Math.max(tmp0_0, tmp2, c);
  var tmp0_1 = f.h8_1;
  // Inline function 'kotlin.math.max' call
  var b_0 = rock.h8_1;
  var tmp2_bass = Math.max(tmp0_1, b_0);
  var tmp0_2 = f.q8_1;
  var tmp2_0 = rock.q8_1;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c_0 = edm.q8_1;
  var tmp3_grit = Math.max(tmp0_2, tmp2_0, c_0);
  return f.x9(tmp2_bass, tmp0_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp1_heavy, tmp3_grit);
}
function vibeShape(f, v, rockness) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  if (v <= 0.25) {
    tmp = blendFrames(shape(Genre_STANDARD_getInstance(), f), shape(Genre_RAP_getInstance(), f), v / 0.25);
  } else if (v <= 0.5) {
    tmp = blendFrames(shape(Genre_RAP_getInstance(), f), shape(Genre_EDM_getInstance(), f), (v - 0.25) / 0.25);
  } else {
    var h = hardWeight(v);
    var fused = hardFusion(f, rockness);
    var scaled = fused.x9(VOID, fused.i8_1 * (0.7 + 0.3 * h), VOID, VOID, VOID, VOID, VOID, VOID, fused.p8_1 * (0.6 + 0.4 * h), fused.q8_1 * (0.8 + 0.2 * h));
    tmp = blendFrames(shape(Genre_EDM_getInstance(), f), scaled, coerceIn_0((v - 0.5) / 0.15, 0.0, 1.0));
  }
  return tmp;
}
function vibeProfile(v, rockness) {
  _init_properties_GenreDetector_kt__z0odbr();
  var hs = profile(Genre_HARDSTYLE_getInstance());
  var rk = profile(Genre_ROCK_getInstance());
  var tmp0 = hs.r9_1;
  // Inline function 'kotlin.math.max' call
  var b = rk.r9_1;
  var tmp = Math.max(tmp0, b);
  var tmp0_0 = hs.s9_1;
  // Inline function 'kotlin.math.max' call
  var b_0 = rk.s9_1;
  var tmp_0 = Math.max(tmp0_0, b_0);
  var tmp0_1 = hs.t9_1;
  // Inline function 'kotlin.math.max' call
  var b_1 = rk.t9_1;
  var tmp_1 = Math.max(tmp0_1, b_1);
  var tmp0_2 = hs.u9_1;
  // Inline function 'kotlin.math.max' call
  var b_2 = rk.u9_1;
  var tmp$ret$3 = Math.max(tmp0_2, b_2);
  var hard = new PartyProfile(tmp, tmp_0, tmp_1, tmp$ret$3);
  return v <= 0.25 ? lerpProfile(profile(Genre_STANDARD_getInstance()), profile(Genre_RAP_getInstance()), v / 0.25) : v <= 0.5 ? lerpProfile(profile(Genre_RAP_getInstance()), profile(Genre_EDM_getInstance()), (v - 0.25) / 0.25) : lerpProfile(profile(Genre_EDM_getInstance()), hard, hardWeight(v));
}
function genreFromApple(name) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  if (name == null) {
    tmp = null;
  } else {
    // Inline function 'kotlin.text.lowercase' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = name.toLowerCase();
  }
  var tmp1_elvis_lhs = tmp;
  var tmp_0;
  if (tmp1_elvis_lhs == null) {
    return null;
  } else {
    tmp_0 = tmp1_elvis_lhs;
  }
  var g = tmp_0;
  return contains_1(g, 'hardstyle') || contains_1(g, 'hardcore') || contains_1(g, 'hard dance') ? Genre_HARDSTYLE_getInstance() : contains_1(g, 'reggaeton') || contains_1(g, 'urbano') || contains_1(g, 'latin urban') || contains_1(g, 'dembow') ? Genre_REGGAETON_getInstance() : contains_1(g, 'reggae') || contains_1(g, 'dancehall') || g === 'ska' || g === 'dub' ? Genre_REGGAE_getInstance() : contains_1(g, 'hip-hop') || contains_1(g, 'hip hop') || contains_1(g, 'rap') || contains_1(g, 'trap') || contains_1(g, 'drill') ? Genre_RAP_getInstance() : contains_1(g, 'metal') || contains_1(g, 'rock') || contains_1(g, 'punk') || contains_1(g, 'alternative') || contains_1(g, 'grunge') ? Genre_ROCK_getInstance() : contains_1(g, 'dance') || contains_1(g, 'electro') || contains_1(g, 'house') || contains_1(g, 'techno') || contains_1(g, 'trance') || contains_1(g, 'edm') || contains_1(g, 'dubstep') || contains_1(g, 'drum') ? Genre_EDM_getInstance() : contains_1(g, 'pop') || contains_1(g, 'r&b') || contains_1(g, 'soul') ? Genre_POP_getInstance() : contains_1(g, 'singer') || contains_1(g, 'country') || contains_1(g, 'folk') || contains_1(g, 'jazz') || contains_1(g, 'classical') || contains_1(g, 'klassisk') || contains_1(g, 'acoustic') || contains_1(g, 'soundtrack') ? Genre_STANDARD_getInstance() : null;
}
function announce($this, now) {
  $this.ba_1 = now;
  $this.ca_1 = true;
}
function updateRockness($this, f, dt) {
  var tmp;
  if ($this.cb_1 || equals($this.da_1, Genre_HARDSTYLE_getInstance()) || equals($this.ea_1, Genre_RAP_getInstance()) || contains_0(get_CALM_LOCK(), $this.ea_1) || equals($this.ea_1, Genre_STANDARD_getInstance())) {
    tmp = 0.0;
  } else {
    var tmp_0;
    var containsArg = f.r8_1;
    if (138.0 <= containsArg ? containsArg <= 250.0 : false) {
      tmp_0 = $this.wa_1 > 2.2;
    } else {
      tmp_0 = false;
    }
    if (tmp_0) {
      tmp = 0.0;
    } else {
      var fewKicks = coerceIn_0((2.5 - $this.wa_1) / 0.8, 0.0, 1.0);
      var snares = coerceIn_0(($this.xa_1 - 0.6) / 1.0, 0.0, 1.0);
      var lowSub = 1.0 - 0.5 * coerceIn_0(($this.va_1 - 0.5) / 0.15, 0.0, 1.0);
      var sound = fewKicks * (0.4 + 0.6 * snares) * lowSub;
      var tmp_1;
      if (equals($this.da_1, Genre_ROCK_getInstance())) {
        // Inline function 'kotlin.math.max' call
        tmp_1 = Math.max(sound, 0.7);
      } else {
        tmp_1 = sound;
      }
      tmp = tmp_1;
    }
  }
  var target = tmp;
  if ($this.cb_1 || equals($this.da_1, Genre_HARDSTYLE_getInstance()) || equals($this.ea_1, Genre_RAP_getInstance()) || contains_0(get_CALM_LOCK(), $this.ea_1) || equals($this.ea_1, Genre_STANDARD_getInstance()))
    $this.db_1 = 0.0;
  else if (f.k8_1 > 0.4) {
    var tmp_2 = $this;
    var tmp_3 = $this.db_1;
    var tmp_4 = target - $this.db_1;
    // Inline function 'kotlin.math.exp' call
    var x = -dt / 4.0;
    tmp_2.db_1 = tmp_3 + tmp_4 * (1.0 - Math.exp(x));
  }
}
function audioGuess($this, bpm) {
  return $this.ua_1 > 0.25 && $this.wa_1 >= 2.3 && (138.0 <= bpm ? bpm <= 250.0 : false) ? Genre_HARDSTYLE_getInstance() : $this.ua_1 > 0.2 && $this.va_1 > 0.53 && $this.wa_1 > 2.3 && (138.0 <= bpm ? bpm <= 250.0 : false) ? Genre_HARDSTYLE_getInstance() : $this.y9_1.equals(Genre_HARDSTYLE_getInstance()) && compare($this.aa_1, $this.qa_1) >= 0 && $this.ua_1 > 0.12 && $this.wa_1 >= 2.0 ? Genre_HARDSTYLE_getInstance() : $this.ua_1 > 0.2 && $this.wa_1 < 2.2 && $this.va_1 < 0.5 && $this.xa_1 > 1.2 ? Genre_ROCK_getInstance() : $this.va_1 > 0.6 && $this.ua_1 < 0.15 && (bpm < 110.0 || $this.wa_1 < 2.0) ? Genre_RAP_getInstance() : (118.0 <= bpm ? bpm <= 136.0 : false) && $this.wa_1 >= 1.8 && $this.ua_1 < 0.2 ? Genre_EDM_getInstance() : Genre_STANDARD_getInstance();
}
function commit($this, g, now, why) {
  if (g.equals($this.y9_1))
    return Unit_instance;
  $this.z9_1 = $this.y9_1;
  $this.y9_1 = g;
  $this.aa_1 = now;
  $this.sa_1 = g;
  $this.ta_1 = now;
  $this.ba_1 = now;
  $this.ga_1 = why;
  if (g.equals(Genre_HARDSTYLE_getInstance()) && !(why === 'valgt'))
    $this.cb_1 = true;
  RaveLog_getInstance().fb('RaveGenre', fmt('\u2192 ' + g.q9_1 + ' (' + why + ') apple=' + $this.pa_1 + ' grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f', [$this.ua_1, $this.va_1, $this.wa_1, $this.xa_1]));
}
function update$avg(decay, old, v) {
  return old * decay + v * (1.0 - decay);
}
function GenreDetector() {
  this.y9_1 = Genre_HARDSTYLE_getInstance();
  this.z9_1 = Genre_HARDSTYLE_getInstance();
  this.aa_1 = new Long(0, 0);
  this.ba_1 = new Long(0, 0);
  this.ca_1 = false;
  this.da_1 = null;
  this.ea_1 = null;
  this.fa_1 = false;
  this.ga_1 = '';
  this.ha_1 = 0.0;
  this.ia_1 = 0.0;
  this.ja_1 = 0.0;
  this.ka_1 = 0.0;
  this.la_1 = new Float32Array(get_entries().m());
  this.ma_1 = null;
  this.na_1 = null;
  this.oa_1 = null;
  this.pa_1 = null;
  this.qa_1 = new Long(0, 0);
  this.ra_1 = new Long(0, 0);
  this.sa_1 = Genre_HARDSTYLE_getInstance();
  this.ta_1 = new Long(0, 0);
  this.ua_1 = 0.0;
  this.va_1 = 0.0;
  this.wa_1 = 0.0;
  this.xa_1 = 0.0;
  this.ya_1 = 0.0;
  this.za_1 = 0.0;
  this.ab_1 = new Long(0, 0);
  this.bb_1 = new Long(0, 0);
  this.cb_1 = false;
  this.db_1 = 0.1;
}
protoOf(GenreDetector).gb = function () {
  return this.cb_1 && this.ea_1 == null;
};
protoOf(GenreDetector).hb = function (now) {
  this.da_1 = null;
  this.pa_1 = null;
  this.qa_1 = now;
  this.ca_1 = false;
  this.cb_1 = false;
  this.ea_1 = null;
  this.fa_1 = false;
  this.bb_1 = new Long(0, 0);
  fill_0(this.la_1, 0.0);
  this.ga_1 = '';
  this.na_1 = null;
  this.oa_1 = null;
  this.ha_1 = 0.0;
  this.ia_1 = 0.0;
  this.ja_1 = 0.0;
  this.ka_1 = 0.0;
  this.db_1 = 0.1;
  if (!this.y9_1.equals(Genre_STANDARD_getInstance())) {
    this.z9_1 = this.y9_1;
    this.y9_1 = Genre_STANDARD_getInstance();
    this.aa_1 = now;
  }
  this.sa_1 = this.y9_1;
  this.ta_1 = now;
};
protoOf(GenreDetector).ib = function (appleGenre, appleExact, deezerGenres, chosen, now) {
  this.fa_1 = true;
  this.pa_1 = appleGenre;
  var a = genreFromApple(appleGenre);
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.collections.firstNotNullOfOrNull' call
    var _iterator__ex2g4s = deezerGenres.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      var result = genreFromApple(element);
      if (!(result == null)) {
        tmp$ret$0 = result;
        break $l$block;
      }
    }
    tmp$ret$0 = null;
  }
  var d = tmp$ret$0;
  var tmp$ret$2;
  $l$block_0: {
    // Inline function 'kotlin.collections.firstOrNull' call
    var _iterator__ex2g4s_0 = deezerGenres.j();
    while (_iterator__ex2g4s_0.k()) {
      var element_0 = _iterator__ex2g4s_0.l();
      if (!(genreFromApple(element_0) == null)) {
        tmp$ret$2 = element_0;
        break $l$block_0;
      }
    }
    tmp$ret$2 = null;
  }
  var tmp0_elvis_lhs = tmp$ret$2;
  var deezerName = tmp0_elvis_lhs == null ? firstOrNull(deezerGenres) : tmp0_elvis_lhs;
  var tmp = this;
  tmp.da_1 = a == null ? d : a;
  var danceGenres = setOf_0([Genre_EDM_getInstance(), Genre_HARDSTYLE_getInstance()]);
  var tmp_0;
  if (contains_0(danceGenres, a)) {
    tmp_0 = true;
  } else {
    var tmp$ret$4;
    $l$block_2: {
      // Inline function 'kotlin.collections.any' call
      var tmp_1;
      if (isInterface(deezerGenres, Collection)) {
        tmp_1 = deezerGenres.o();
      } else {
        tmp_1 = false;
      }
      if (tmp_1) {
        tmp$ret$4 = false;
        break $l$block_2;
      }
      var _iterator__ex2g4s_1 = deezerGenres.j();
      while (_iterator__ex2g4s_1.k()) {
        var element_1 = _iterator__ex2g4s_1.l();
        if (contains_0(danceGenres, genreFromApple(element_1))) {
          tmp$ret$4 = true;
          break $l$block_2;
        }
      }
      tmp$ret$4 = false;
    }
    tmp_0 = tmp$ret$4;
  }
  var dance = tmp_0;
  var tmp_2;
  if (!((chosen == null ? this.oa_1 : chosen) == null)) {
    tmp_2 = to(ensureNotNull(chosen == null ? this.oa_1 : chosen), 'du');
  } else {
    if (!(this.na_1 == null)) {
      tmp_2 = to(ensureNotNull(this.na_1), 'stil-l\xE6rer');
    } else {
      if (equals(a, Genre_RAP_getInstance()) && (appleExact || equals(d, Genre_RAP_getInstance())) && !dance) {
        tmp_2 = to(Genre_RAP_getInstance(), 'Apple: ' + appleGenre);
      } else {
        if (a == null && equals(d, Genre_RAP_getInstance())) {
          tmp_2 = to(Genre_RAP_getInstance(), 'Deezer: ' + deezerName);
        } else {
          if (contains_0(get_CALM_LOCK(), a) && (appleExact || equals(d, a)) && !dance) {
            tmp_2 = to(ensureNotNull(a), 'Apple: ' + appleGenre);
          } else {
            if (a == null && contains_0(get_CALM_LOCK(), d)) {
              tmp_2 = to(ensureNotNull(d), 'Deezer: ' + deezerName);
            } else {
              tmp_2 = to(null, '');
            }
          }
        }
      }
    }
  }
  var _destruct__k2r9zo = tmp_2;
  var lock = _destruct__k2r9zo.s7();
  var why = _destruct__k2r9zo.t7();
  if (!(lock == null)) {
    this.ea_1 = lock;
    if (!equals(lock, Genre_HARDSTYLE_getInstance())) {
      this.cb_1 = false;
      this.bb_1 = new Long(0, 0);
    }
    if (equals(lock, Genre_RAP_getInstance()) || get_CALM_LOCK().p(lock))
      this.db_1 = 0.0;
    if (this.ma_1 == null) {
      commit(this, lock, now, why);
      announce(this, now);
    }
    this.ga_1 = why;
    return Unit_instance;
  }
  var tmp4_elvis_lhs = this.da_1;
  var tmp_3;
  if (tmp4_elvis_lhs == null) {
    return Unit_instance;
  } else {
    tmp_3 = tmp4_elvis_lhs;
  }
  var g = tmp_3;
  var src = !(a == null) ? 'Apple: ' + appleGenre : 'Deezer: ' + deezerName;
  if (this.ma_1 == null && !g.equals(Genre_EDM_getInstance())) {
    commit(this, g, now, src);
    announce(this, now);
    this.ga_1 = src;
  }
};
protoOf(GenreDetector).jb = function (f, now) {
  var tmp;
  if (equalsLong(this.ra_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.ra_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn_0(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.ra_1 = now;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / 8.0;
  var decay = Math.exp(x);
  this.ua_1 = update$avg(decay, this.ua_1, f.q8_1);
  this.va_1 = update$avg(decay, this.va_1, f.u8_1);
  var kickHit = f.i8_1 > 0.95 && this.ya_1 <= 0.95 ? 1.0 : 0.0;
  var snareHit = f.s8_1 > 0.95 && this.za_1 <= 0.95 ? 1.0 : 0.0;
  this.ya_1 = f.i8_1;
  this.za_1 = f.s8_1;
  this.wa_1 = this.wa_1 * decay + kickHit / 8.0;
  this.xa_1 = this.xa_1 * decay + snareHit / 8.0;
  updateRockness(this, f, dt);
  var _array__4zh2yp = this.la_1;
  var _index_0__fvwizt = this.y9_1.z_1;
  _array__4zh2yp[_index_0__fvwizt] = _array__4zh2yp[_index_0__fvwizt] + dt;
  if (f.k8_1 > 0.05)
    this.ka_1 = this.ka_1 + dt;
  var tmp_0 = this;
  var tmp_1 = this.ia_1;
  var tmp_2 = f.k8_1 - this.ia_1;
  // Inline function 'kotlin.math.exp' call
  var x_0 = -dt / 1.5;
  tmp_0.ia_1 = tmp_1 + tmp_2 * (1.0 - Math.exp(x_0));
  var tmp_3 = this;
  var tmp_4 = this.ja_1;
  var tmp_5 = f.k8_1 - this.ja_1;
  // Inline function 'kotlin.math.exp' call
  var x_1 = -dt / (this.ka_1 < 10.0 ? 1.5 : 40.0);
  tmp_3.ja_1 = tmp_4 + tmp_5 * (1.0 - Math.exp(x_1));
  var lift = this.ka_1 < 10.0 ? 0.0 : coerceIn_0((this.ia_1 - this.ja_1 - 0.015) / 0.07, 0.0, 1.0);
  var tmp_6 = this;
  var tmp_7 = this.ha_1;
  var tmp_8 = lift - this.ha_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 0.8;
  tmp_6.ha_1 = tmp_7 + tmp_8 * (1.0 - Math.exp(x_2));
  if (compare(subtract(now, this.ab_1), new Long(5000, 0)) >= 0) {
    this.ab_1 = now;
    RaveLog_getInstance().fb('RaveGenre', fmt('n\xE5=' + this.y9_1.q9_1 + ' apple=' + this.pa_1 + ' bpm=%.0f grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f rock=%.2f refreng=%.2f \u2192 lyd sier ' + audioGuess(this, f.r8_1).q9_1, [f.r8_1, this.ua_1, this.va_1, this.wa_1, this.xa_1, this.db_1, this.ha_1]));
  }
  var tmp0_safe_receiver = this.ma_1;
  if (tmp0_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    if (!tmp0_safe_receiver.equals(this.y9_1)) {
      commit(this, tmp0_safe_receiver, now, 'valgt');
    }
    return this.y9_1;
  }
  var tmp1_safe_receiver = this.ea_1;
  if (tmp1_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    if (!tmp1_safe_receiver.equals(this.y9_1)) {
      // Inline function 'kotlin.text.ifBlank' call
      var this_1 = this.ga_1;
      var tmp_9;
      if (isBlank(this_1)) {
        tmp_9 = 'l\xE5st';
      } else {
        tmp_9 = this_1;
      }
      var tmp$ret$9 = tmp_9;
      commit(this, tmp1_safe_receiver, now, tmp$ret$9);
    }
    return this.y9_1;
  }
  var metaKnown = this.fa_1 || compare(subtract(now, this.qa_1), new Long(4000, 0)) >= 0;
  if (!equals(this.da_1, Genre_ROCK_getInstance()) && f.p8_1 > 0.45 && f.q8_1 > 0.3) {
    if (equalsLong(this.bb_1, new Long(0, 0)))
      this.bb_1 = now;
  } else if (f.p8_1 < 0.2)
    this.bb_1 = new Long(0, 0);
  if (compare(this.bb_1, new Long(0, 0)) > 0 && compare(subtract(now, this.bb_1), new Long(800, 0)) >= 0 && !this.y9_1.equals(Genre_HARDSTYLE_getInstance()) && metaKnown) {
    commit(this, Genre_HARDSTYLE_getInstance(), now, 'r\xE5tt drop');
  }
  if ((this.da_1 == null || equals(this.da_1, Genre_EDM_getInstance())) && compare(subtract(now, this.qa_1), new Long(8000, 0)) < 0)
    return this.y9_1;
  if (!this.ca_1) {
    announce(this, now);
  }
  var audio = audioGuess(this, f.r8_1);
  var calm = f.k8_1 < 0.2;
  var containsArg = f.r8_1;
  var hardstyleTempo = 138.0 <= containsArg ? containsArg <= 250.0 : false;
  var obviousHardstyle = hardstyleTempo && this.wa_1 > 2.2;
  var target = this.cb_1 ? Genre_HARDSTYLE_getInstance() : obviousHardstyle && !equals(this.da_1, Genre_ROCK_getInstance()) && !(contains_0(get_CALM_LOCK(), this.da_1) || equals(this.da_1, Genre_RAP_getInstance())) ? Genre_HARDSTYLE_getInstance() : obviousHardstyle && this.ua_1 > 0.12 ? Genre_HARDSTYLE_getInstance() : equals(this.da_1, Genre_EDM_getInstance()) && hardstyleTempo ? Genre_HARDSTYLE_getInstance() : equals(this.da_1, Genre_EDM_getInstance()) && this.ua_1 > 0.25 ? Genre_HARDSTYLE_getInstance() : compare(this.bb_1, new Long(0, 0)) > 0 ? Genre_HARDSTYLE_getInstance() : calm ? Genre_STANDARD_getInstance() : audio.equals(Genre_HARDSTYLE_getInstance()) ? Genre_HARDSTYLE_getInstance() : !(this.da_1 == null) ? ensureNotNull(this.da_1) : audio;
  if (target.equals(Genre_HARDSTYLE_getInstance()) && this.y9_1.equals(Genre_HARDSTYLE_getInstance()) && compare(this.aa_1, this.qa_1) >= 0)
    this.cb_1 = true;
  if (!target.equals(this.sa_1)) {
    this.sa_1 = target;
    this.ta_1 = now;
  }
  var needed = this.y9_1.equals(Genre_STANDARD_getInstance()) && !calm ? new Long(1500, 0) : this.sa_1.equals(Genre_HARDSTYLE_getInstance()) && this.ua_1 > 0.3 ? new Long(2000, 0) : this.sa_1.equals(Genre_STANDARD_getInstance()) ? new Long(5000, 0) : new Long(6000, 0);
  if (!this.sa_1.equals(this.y9_1) && compare(subtract(now, this.ta_1), needed) >= 0) {
    commit(this, this.sa_1, now, calm ? 'rolig del' : 'lyd');
  }
  return this.y9_1;
};
var static_init_called_0;
function static_init_0() {
  if (static_init_called_0)
    return Unit_instance;
  static_init_called_0 = true;
  SongPart_INTRO_instance = new SongPart('INTRO', 0, 'intro');
  SongPart_VOCAL_instance = new SongPart('VOCAL', 1, 'synging');
  SongPart_BREAKDOWN_instance = new SongPart('BREAKDOWN', 2, 'breakdown');
  SongPart_BUILDUP_instance = new SongPart('BUILDUP', 3, 'build-up');
  SongPart_DROP_instance = new SongPart('DROP', 4, 'drop');
  SongPart_GROOVE_instance = new SongPart('GROOVE', 5, 'mellom drops');
  SongPart_OUTRO_instance = new SongPart('OUTRO', 6, 'avslutning');
  SongPart_ANTI_CLIMAX_instance = new SongPart('ANTI_CLIMAX', 7, 'anti-climax');
}
var SongPart_INTRO_instance;
var SongPart_VOCAL_instance;
var SongPart_BREAKDOWN_instance;
var SongPart_BUILDUP_instance;
var SongPart_DROP_instance;
var SongPart_GROOVE_instance;
var SongPart_OUTRO_instance;
var SongPart_ANTI_CLIMAX_instance;
function SongPart(name, ordinal, label) {
  Enum.call(this, name, ordinal);
  this.mb_1 = label;
}
var static_init_called_1;
function static_init_1() {
  if (static_init_called_1)
    return Unit_instance;
  static_init_called_1 = true;
  DropKind_NONE_instance = new DropKind('NONE', 0, '');
  DropKind_PENDING_instance = new DropKind('PENDING', 1, 'DROP');
  DropKind_FIRST_instance = new DropKind('FIRST', 2, 'F\xD8RSTE DROP');
  DropKind_MIDDLE_instance = new DropKind('MIDDLE', 3, 'DROP');
  DropKind_LAST_instance = new DropKind('LAST', 4, 'SISTE DROP');
}
var DropKind_NONE_instance;
var DropKind_PENDING_instance;
var DropKind_FIRST_instance;
var DropKind_MIDDLE_instance;
var DropKind_LAST_instance;
function DropKind(name, ordinal, label) {
  Enum.call(this, name, ordinal);
  this.pb_1 = label;
}
function StructureHud(part, barInPhrase, phrase, ready, subRelDb, airTrendDb, build, grit, screech, vocalHint, bpm) {
  part = part === VOID ? 'INTRO' : part;
  barInPhrase = barInPhrase === VOID ? 0 : barInPhrase;
  phrase = phrase === VOID ? 0 : phrase;
  ready = ready === VOID ? false : ready;
  subRelDb = subRelDb === VOID ? 0.0 : subRelDb;
  airTrendDb = airTrendDb === VOID ? 0.0 : airTrendDb;
  build = build === VOID ? 0.0 : build;
  grit = grit === VOID ? 0.0 : grit;
  screech = screech === VOID ? 0.0 : screech;
  vocalHint = vocalHint === VOID ? false : vocalHint;
  bpm = bpm === VOID ? 0.0 : bpm;
  this.qb_1 = part;
  this.rb_1 = barInPhrase;
  this.sb_1 = phrase;
  this.tb_1 = ready;
  this.ub_1 = subRelDb;
  this.vb_1 = airTrendDb;
  this.wb_1 = build;
  this.xb_1 = grit;
  this.yb_1 = screech;
  this.zb_1 = vocalHint;
  this.ac_1 = bpm;
}
protoOf(StructureHud).toString = function () {
  return 'StructureHud(part=' + this.qb_1 + ', barInPhrase=' + this.rb_1 + ', phrase=' + this.sb_1 + ', ready=' + this.tb_1 + ', subRelDb=' + this.ub_1 + ', airTrendDb=' + this.vb_1 + ', build=' + this.wb_1 + ', grit=' + this.xb_1 + ', screech=' + this.yb_1 + ', vocalHint=' + this.zb_1 + ', bpm=' + this.ac_1 + ')';
};
protoOf(StructureHud).hashCode = function () {
  var result = getStringHashCode(this.qb_1);
  result = imul_0(result, 31) + this.rb_1 | 0;
  result = imul_0(result, 31) + this.sb_1 | 0;
  result = imul_0(result, 31) + getBooleanHashCode(this.tb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ub_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.vb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.wb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.xb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.yb_1) | 0;
  result = imul_0(result, 31) + getBooleanHashCode(this.zb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ac_1) | 0;
  return result;
};
protoOf(StructureHud).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof StructureHud))
    return false;
  if (!(this.qb_1 === other.qb_1))
    return false;
  if (!(this.rb_1 === other.rb_1))
    return false;
  if (!(this.sb_1 === other.sb_1))
    return false;
  if (!(this.tb_1 === other.tb_1))
    return false;
  if (!equals(this.ub_1, other.ub_1))
    return false;
  if (!equals(this.vb_1, other.vb_1))
    return false;
  if (!equals(this.wb_1, other.wb_1))
    return false;
  if (!equals(this.xb_1, other.xb_1))
    return false;
  if (!equals(this.yb_1, other.yb_1))
    return false;
  if (!(this.zb_1 === other.zb_1))
    return false;
  if (!equals(this.ac_1, other.ac_1))
    return false;
  return true;
};
function PartyTuning() {
  PartyTuning_instance = this;
  this.bc_1 = -2.5;
  this.cc_1 = 2.0;
  this.dc_1 = -3.0;
  this.ec_1 = -1.5;
  this.fc_1 = -4.0;
  this.gc_1 = 2.0;
  this.hc_1 = -99.0;
  this.ic_1 = 0.02;
  this.jc_1 = -0.04;
  this.kc_1 = false;
}
var PartyTuning_instance;
function PartyTuning_getInstance() {
  if (PartyTuning_instance == null)
    new PartyTuning();
  return PartyTuning_instance;
}
function db($this, x) {
  // Inline function 'kotlin.math.max' call
  // Inline function 'kotlin.math.log10' call
  var x_0 = Math.max(x, 2.5);
  return 20.0 * log10(x_0);
}
function show($this, text, now, always) {
  always = always === VOID ? false : always;
  if (!always && (text === $this.nc_1 || compare(subtract(now, $this.te_1), new Long(6000, 0)) < 0))
    return Unit_instance;
  $this.nc_1 = text;
  $this.oc_1 = now;
  $this.te_1 = now;
}
function enter($this, next, now, why) {
  if (next.equals($this.lc_1))
    return Unit_instance;
  RaveLog_getInstance().fb('RaveGenre', 'del: ' + $this.lc_1.mb_1 + ' \u2192 ' + next.mb_1 + ' (' + why + ')');
  if ($this.lc_1.equals(SongPart_DROP_getInstance()))
    $this.de_1 = now;
  if (next.equals(SongPart_DROP_getInstance())) {
    $this.xd_1 = new Long(0, 0);
    $this.ee_1 = new Long(0, 0);
  }
  $this.lc_1 = next;
  $this.sc_1 = now;
  switch (next.z_1) {
    case 3:
      $this.he_1 = true;
      $this.ie_1 = true;
      show($this, 'BUILD-UP', now);
      break;
    case 2:
      $this.he_1 = true;
      $this.ie_1 = true;
      show($this, 'BREAKDOWN', now);
      break;
    case 1:
      $this.he_1 = true;
      $this.ie_1 = true;
      show($this, 'BREAKDOWN (SYNG?)', now);
      break;
    case 7:
      $this.he_1 = true;
      $this.ie_1 = true;
      show($this, 'ANTI-CLIMAX', now);
      break;
    default:
      break;
  }
}
function voteBoundary($this, beat) {
  var _array__4zh2yp = $this.ue_1;
  var _index_0__fvwizt = ((beat % 32 | 0) + 32 | 0) % 32 | 0;
  _array__4zh2yp[_index_0__fvwizt] = _array__4zh2yp[_index_0__fvwizt] + 1 | 0;
}
function update$ema(dt, old, v, s) {
  var tmp = v - old;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / s;
  return old + tmp * (1.0 - Math.exp(x));
}
function HardstyleStructure() {
  this.lc_1 = SongPart_INTRO_getInstance();
  this.mc_1 = DropKind_NONE_getInstance();
  this.nc_1 = '';
  this.oc_1 = new Long(0, 0);
  this.pc_1 = new StructureHud();
  this.qc_1 = new Long(0, 0);
  this.rc_1 = new Long(0, 0);
  this.sc_1 = new Long(0, 0);
  this.tc_1 = 0.0;
  this.uc_1 = 0.0;
  this.vc_1 = 0.0;
  this.wc_1 = 0.0;
  this.xc_1 = 0.0;
  this.yc_1 = 0.0;
  this.zc_1 = 0.0;
  this.ad_1 = 0.0;
  this.bd_1 = new Long(0, 0);
  this.cd_1 = new Long(0, 0);
  this.dd_1 = 0.0;
  this.ed_1 = 0.0;
  this.fd_1 = 0.0;
  this.gd_1 = 0.0;
  this.hd_1 = 0.0;
  this.id_1 = new Long(0, 0);
  this.jd_1 = false;
  this.kd_1 = false;
  this.ld_1 = new Long(0, 0);
  this.md_1 = true;
  this.nd_1 = false;
  this.od_1 = false;
  this.pd_1 = 1600.0;
  this.qd_1 = -1.0;
  this.rd_1 = 0.0;
  this.sd_1 = 0.0;
  this.td_1 = 0.0;
  this.ud_1 = 0.0;
  this.vd_1 = 0.0;
  this.wd_1 = 0.0;
  this.xd_1 = new Long(0, 0);
  this.yd_1 = null;
  this.zd_1 = null;
  this.ae_1 = 0.0;
  this.be_1 = new Long(0, 0);
  this.ce_1 = 0.0;
  this.de_1 = new Long(0, 0);
  this.ee_1 = new Long(0, 0);
  this.fe_1 = 0.0;
  this.ge_1 = 0.0;
  this.he_1 = false;
  this.ie_1 = false;
  this.je_1 = new Long(0, 0);
  this.ke_1 = new Long(0, 0);
  this.le_1 = new Long(0, 0);
  this.me_1 = 0.0;
  this.ne_1 = 0.0;
  this.oe_1 = new Long(0, 0);
  this.pe_1 = 0;
  this.qe_1 = false;
  this.re_1 = 0.0;
  this.se_1 = 0.4;
  this.te_1 = new Long(0, 0);
  this.ue_1 = new Int32Array(32);
  this.ve_1 = -1;
}
protoOf(HardstyleStructure).we = function () {
  return this.lc_1.equals(SongPart_DROP_getInstance()) && !this.mc_1.equals(DropKind_PENDING_getInstance());
};
protoOf(HardstyleStructure).xe = function () {
  return this.pe_1;
};
protoOf(HardstyleStructure).hb = function (now) {
  this.lc_1 = SongPart_INTRO_getInstance();
  this.mc_1 = DropKind_NONE_getInstance();
  this.nc_1 = '';
  this.oc_1 = new Long(0, 0);
  this.pc_1 = new StructureHud();
  this.rc_1 = now;
  this.sc_1 = now;
  this.jd_1 = false;
  this.kd_1 = false;
  this.ld_1 = new Long(0, 0);
  this.xd_1 = new Long(0, 0);
  this.ee_1 = new Long(0, 0);
  this.fe_1 = 0.0;
  this.ge_1 = 0.0;
  this.de_1 = new Long(0, 0);
  this.zd_1 = null;
  this.ae_1 = 0.0;
  this.ce_1 = 0.0;
  this.be_1 = new Long(0, 0);
  this.he_1 = false;
  this.ie_1 = false;
  this.je_1 = new Long(0, 0);
  this.ke_1 = new Long(0, 0);
  this.le_1 = new Long(0, 0);
  this.oe_1 = new Long(0, 0);
  this.pe_1 = 0;
  this.qe_1 = false;
  this.re_1 = 0.0;
  this.se_1 = 0.4;
  this.te_1 = new Long(0, 0);
  fill(this.ue_1, 0);
  this.ve_1 = -1;
  this.id_1 = new Long(0, 0);
  this.fd_1 = 0.0;
  this.yc_1 = 0.0;
  this.zc_1 = 0.0;
  this.ad_1 = 0.0;
  this.bd_1 = new Long(0, 0);
  this.cd_1 = new Long(0, 0);
};
protoOf(HardstyleStructure).ye = function (f, now, positionMs, durationMs) {
  var tmp;
  if (equalsLong(this.qc_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.qc_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn_0(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.qc_1 = now;
  if (equalsLong(this.rc_1, new Long(0, 0))) {
    this.rc_1 = now;
    this.sc_1 = now;
  }
  var subDb = db(this, f.z8_1);
  var airDb = db(this, f.y8_1);
  if (!this.jd_1) {
    this.tc_1 = subDb;
    this.uc_1 = subDb;
    this.vc_1 = subDb;
    this.wc_1 = airDb;
    this.xc_1 = airDb;
    this.dd_1 = subDb;
    this.ed_1 = subDb;
    this.zc_1 = f.f9_1;
    this.ad_1 = f.f9_1;
    this.jd_1 = true;
    this.rd_1 = subDb;
    this.sd_1 = airDb;
    this.td_1 = db(this, f.a9_1);
    this.ud_1 = this.rd_1;
    this.vd_1 = this.sd_1;
    this.wd_1 = this.td_1;
  }
  if (!this.kd_1 && compare(subtract(now, this.rc_1), new Long(1500, 0)) >= 0 && compare(positionMs, new Long(0, 0)) >= 0) {
    this.kd_1 = true;
    if (compare(subtract(positionMs, subtract(now, this.rc_1)), new Long(30000, 0)) > 0) {
      this.ie_1 = true;
      this.he_1 = true;
    }
  }
  this.tc_1 = update$ema(dt, this.tc_1, subDb, 0.25);
  this.uc_1 = update$ema(dt, this.uc_1, subDb, 1.0);
  this.vc_1 = update$ema(dt, this.vc_1, subDb, 8.0);
  var tmp_0 = this;
  var tmp0 = this.uc_1;
  // Inline function 'kotlin.math.max' call
  var b = this.dd_1 - dt * (6.0 / 25.0);
  tmp_0.dd_1 = Math.max(tmp0, b);
  var tmp_1 = this;
  var tmp0_0 = this.uc_1;
  // Inline function 'kotlin.comparisons.minOf' call
  var b_0 = this.ed_1 + dt * 1.5;
  tmp_1.ed_1 = Math.min(tmp0_0, b_0);
  this.wc_1 = update$ema(dt, this.wc_1, airDb, 1.0);
  this.xc_1 = update$ema(dt, this.xc_1, airDb, 8.0);
  this.yc_1 = update$ema(dt, this.yc_1, f.q8_1, 1.0);
  this.rd_1 = update$ema(dt, this.rd_1, subDb, 2.0);
  this.sd_1 = update$ema(dt, this.sd_1, airDb, 2.0);
  this.td_1 = update$ema(dt, this.td_1, db(this, f.a9_1), 2.0);
  var fall = dt * 0.05;
  var tmp_2 = this;
  var tmp0_1 = this.rd_1;
  // Inline function 'kotlin.math.max' call
  var b_1 = this.ud_1 - fall;
  tmp_2.ud_1 = Math.max(tmp0_1, b_1);
  var tmp_3 = this;
  var tmp0_2 = this.sd_1;
  // Inline function 'kotlin.math.max' call
  var b_2 = this.vd_1 - fall;
  tmp_3.vd_1 = Math.max(tmp0_2, b_2);
  var tmp_4 = this;
  var tmp0_3 = this.td_1;
  // Inline function 'kotlin.math.max' call
  var b_3 = this.wd_1 - fall;
  tmp_4.wd_1 = Math.max(tmp0_3, b_3);
  this.fe_1 = (this.sd_1 - this.vd_1 + (this.td_1 - this.wd_1)) / 2.0;
  this.ge_1 = this.rd_1 - this.ud_1;
  var warmedUp = compare(subtract(now, this.rc_1), new Long(20000, 0)) > 0;
  var print = this.yd_1;
  if (!(print == null) && PartyTuning_getInstance().kc_1 && f.n8_1.m() === print.length) {
    var tmp0_elvis_lhs = this.zd_1;
    var tmp_5;
    if (tmp0_elvis_lhs == null) {
      // Inline function 'kotlin.also' call
      var this_1 = new Float32Array(print.length);
      this.zd_1 = this_1;
      tmp_5 = this_1;
    } else {
      tmp_5 = tmp0_elvis_lhs;
    }
    var e = tmp_5;
    // Inline function 'kotlin.math.exp' call
    var x = -dt / 4.0;
    var a = 1.0 - Math.exp(x);
    var d = 0.0;
    var na = 0.0;
    var nb = 0.0;
    var inductionVariable = 0;
    var last = e.length - 1 | 0;
    if (inductionVariable <= last)
      do {
        var i = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        e[i] = e[i] + (f.n8_1.n(i) - e[i]) * a;
        d = d + e[i] * print[i];
        na = na + e[i] * e[i];
        nb = nb + print[i] * print[i];
      }
       while (inductionVariable <= last);
    var tmp_6;
    if (na > 0.0 && nb > 0.0) {
      var tmp_7 = d;
      // Inline function 'kotlin.math.sqrt' call
      var x_0 = na * nb;
      tmp_6 = tmp_7 / Math.sqrt(x_0);
    } else {
      tmp_6 = 0.0;
    }
    var like = tmp_6;
    var tmp_8 = this;
    var tmp_9;
    if (this.ae_1 === 0.0) {
      tmp_9 = like;
    } else {
      var tmp_10 = this.ae_1;
      var tmp_11 = like - this.ae_1;
      // Inline function 'kotlin.math.exp' call
      var x_1 = -dt / 30.0;
      tmp_9 = tmp_10 + tmp_11 * (1.0 - Math.exp(x_1));
    }
    tmp_8.ae_1 = tmp_9;
    this.ce_1 = like - this.ae_1;
  }
  var printOk = !(print == null) && PartyTuning_getInstance().kc_1 && warmedUp;
  this.zc_1 = update$ema(dt, this.zc_1, f.f9_1, 1.0);
  this.ad_1 = update$ema(dt, this.ad_1, f.f9_1, 8.0);
  var kickHit = f.i8_1 > 0.95 && this.hd_1 <= 0.95;
  var snareHit = f.s8_1 > 0.95 && this.gd_1 <= 0.95;
  this.hd_1 = f.i8_1;
  this.gd_1 = f.s8_1;
  if (kickHit)
    this.id_1 = now;
  var tmp_12 = this;
  var tmp_13 = this.fd_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 2.0;
  tmp_12.fd_1 = tmp_13 * Math.exp(x_2) + (snareHit ? 1.0 : 0.0) / 2.0;
  var tmp_14;
  var containsArg = f.r8_1;
  if (100.0 <= containsArg ? containsArg <= 260.0 : false) {
    tmp_14 = 240000.0 / f.r8_1;
  } else {
    tmp_14 = 1600.0;
  }
  var barMs = tmp_14;
  this.pd_1 = barMs;
  var forced = this.nd_1 || compare(now, this.ld_1) < 0;
  this.od_1 = (!this.nd_1 && compare(now, this.ld_1) < 0);
  var subRel = this.uc_1 - this.vc_1;
  var subHitRel = this.tc_1 - this.vc_1;
  var airTrend = this.wc_1 - this.xc_1;
  var songFraction = compare(durationMs, new Long(0, 0)) > 0 && compare(positionMs, new Long(0, 0)) >= 0 ? toNumber(positionMs) / toNumber(durationMs) : -1.0;
  this.qd_1 = songFraction;
  var remainingMs = compare(durationMs, new Long(0, 0)) > 0 && compare(positionMs, new Long(0, 0)) >= 0 ? subtract(durationMs, positionMs) : new Long(-1, -1);
  var kickGone = equalsLong(this.id_1, new Long(0, 0)) || toNumber(subtract(now, this.id_1)) > barMs;
  if (!this.ie_1 && toNumber(subtract(now, this.rc_1)) > 32 * barMs)
    this.ie_1 = true;
  var riser = airTrend > 0.0 ? coerceIn_0((this.zc_1 - this.ad_1) / 0.12, 0.0, 1.0) : 0.0;
  var build = 0.4 * coerceIn_0(-subRel / 6.0, 0.0, 1.0) + 0.25 * coerceIn_0(airTrend / 4.0, 0.0, 1.0) + 0.15 * coerceIn_0((this.fd_1 - 1.0) / 3.0, 0.0, 1.0) + 0.2 * riser;
  var buildEvidence = build >= 0.55 && subRel < -3.0 && (airTrend > 1.5 || this.fd_1 > 2.0 || riser > 0.5);
  if (buildEvidence) {
    if (equalsLong(this.je_1, new Long(0, 0)))
      this.je_1 = now;
    this.ke_1 = new Long(0, 0);
  } else {
    if (equalsLong(this.ke_1, new Long(0, 0)))
      this.ke_1 = now;
    if (compare(subtract(now, this.ke_1), new Long(1000, 0)) > 0)
      this.je_1 = new Long(0, 0);
  }
  if (this.lc_1.z_1 === 4) {
    if (!forced && this.mc_1.equals(DropKind_PENDING_getInstance()) && toNumber(subtract(now, this.le_1)) >= barMs) {
      var atLoudLevel = this.uc_1 >= this.dd_1 - 3.0 && !kickGone && this.uc_1 - this.me_1 >= 1.5;
      var fullEnough = !warmedUp || (this.fe_1 >= PartyTuning_getInstance().fc_1 && this.ge_1 >= PartyTuning_getInstance().hc_1);
      if (!fullEnough) {
        this.mc_1 = DropKind_NONE_getInstance();
        this.ed_1 = this.uc_1;
        RaveLog_getInstance().fb('RaveGenre', fmt('ikke drop: diskant/vokal %.1f dB under toppen', [-this.fe_1]));
        enter(this, SongPart_BREAKDOWN_getInstance(), now, 'ikke fullt nok for drop');
      } else if (this.uc_1 - this.me_1 >= 3.0 || atLoudLevel || (printOk && !kickGone && this.ce_1 >= PartyTuning_getInstance().ic_1)) {
        this.pe_1 = this.pe_1 + 1 | 0;
        this.bd_1 = this.le_1;
        this.he_1 = false;
        this.re_1 = this.qe_1 ? 0.1 : 0.0;
        this.qe_1 = false;
        this.mc_1 = songFraction >= 0.6 ? DropKind_LAST_getInstance() : this.pe_1 === 1 ? DropKind_FIRST_getInstance() : DropKind_MIDDLE_getInstance();
        show(this, this.mc_1.pb_1, now, true);
        RaveLog_getInstance().fb('RaveGenre', fmt('ekte drop #' + this.pe_1 + ' \u2192 ' + this.mc_1.pb_1 + ' (%.0f%% ut, sub +%.1f dB)', [songFraction * 100.0, this.uc_1 - this.me_1]));
      } else {
        this.qe_1 = true;
        this.mc_1 = DropKind_NONE_getInstance();
        if (f.w8_1 > 0.35 && this.yc_1 > 0.25) {
          RaveLog_getInstance().fb('RaveGenre', fmt('ANTI-CLIMAX (sub bare +%.1f dB, screech %.2f)', [this.uc_1 - this.me_1, f.w8_1]));
          enter(this, SongPart_ANTI_CLIMAX_getInstance(), now, 'anti-climax');
        } else {
          show(this, 'FAKE DROP', now, compare(subtract(now, this.cd_1), new Long(8000, 0)) > 0);
          RaveLog_getInstance().fb('RaveGenre', fmt('FAKE DROP (sub bare +%.1f dB etter 1 takt)', [this.uc_1 - this.me_1]));
          enter(this, kickGone ? SongPart_BREAKDOWN_getInstance() : SongPart_BUILDUP_getInstance(), now, 'fake drop');
        }
        this.cd_1 = now;
        this.ed_1 = this.uc_1;
        this.he_1 = true;
      }
    }
    if (!forced && this.lc_1.equals(SongPart_DROP_getInstance()) && !this.mc_1.equals(DropKind_PENDING_getInstance())) {
      if (this.uc_1 < this.ne_1 - 6.0 || kickGone) {
        if (equalsLong(this.oe_1, new Long(0, 0)))
          this.oe_1 = now;
      } else
        this.oe_1 = new Long(0, 0);
      if (compare(this.oe_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.oe_1)) >= barMs) {
        this.mc_1 = DropKind_NONE_getInstance();
        this.re_1 = 0.0;
        this.oe_1 = new Long(0, 0);
        enter(this, kickGone ? SongPart_BREAKDOWN_getInstance() : compare(this.je_1, new Long(0, 0)) > 0 ? SongPart_BUILDUP_getInstance() : SongPart_GROOVE_getInstance(), now, 'bassen borte i 1 takt');
      } else if (compare(this.je_1, new Long(0, 0)) > 0 && compare(subtract(now, this.je_1), new Long(2000, 0)) >= 0) {
        this.mc_1 = DropKind_NONE_getInstance();
        this.re_1 = 0.0;
        this.oe_1 = new Long(0, 0);
        enter(this, SongPart_BUILDUP_getInstance(), now, 'build-up inni dropet');
      } else if (warmedUp) {
        var buildSig = this.ge_1 < PartyTuning_getInstance().dc_1 && this.fe_1 > PartyTuning_getInstance().ec_1;
        var unlike = printOk && PartyTuning_getInstance().jc_1 < 0.0 && this.ce_1 < PartyTuning_getInstance().jc_1;
        var dull = this.fe_1 < PartyTuning_getInstance().bc_1 || unlike;
        this.ee_1 = buildSig ? equalsLong(this.ee_1, new Long(0, 0)) ? now : this.ee_1 : new Long(0, 0);
        this.xd_1 = dull ? equalsLong(this.xd_1, new Long(0, 0)) ? now : this.xd_1 : new Long(0, 0);
        if (compare(this.ee_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.ee_1)) >= barMs) {
          this.mc_1 = DropKind_NONE_getInstance();
          this.re_1 = 0.0;
          this.ee_1 = new Long(0, 0);
          this.xd_1 = new Long(0, 0);
          enter(this, SongPart_BUILDUP_getInstance(), now, 'lite sub, full diskant');
        } else if (compare(this.xd_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.xd_1)) >= PartyTuning_getInstance().cc_1 * barMs) {
          this.mc_1 = DropKind_NONE_getInstance();
          this.re_1 = 0.0;
          this.ee_1 = new Long(0, 0);
          this.xd_1 = new Long(0, 0);
          enter(this, SongPart_BREAKDOWN_getInstance(), now, fmt('diskant/vokal ned %.1f dB', [this.fe_1]));
        }
      }
    }
  } else {
    var tmp_15;
    if (compare(this.bd_1, new Long(0, 0)) > 0) {
      var tmp_16 = subtract(now, this.bd_1);
      var tmp0_4 = new Long(16000, 0);
      // Inline function 'kotlin.comparisons.minOf' call
      var b_4 = numberToLong(8 * barMs);
      var tmp$ret$12 = compare(tmp0_4, b_4) <= 0 ? tmp0_4 : b_4;
      tmp_15 = compare(tmp_16, tmp$ret$12) < 0;
    } else {
      tmp_15 = false;
    }
    var lockedOut = tmp_15;
    var afterFake = compare(this.cd_1, new Long(0, 0)) > 0 && compare(subtract(now, this.cd_1), numberToLong(2 * barMs)) < 0;
    var unprepared = !this.he_1 && (this.lc_1.equals(SongPart_INTRO_getInstance()) || this.lc_1.equals(SongPart_GROOVE_getInstance()) || this.lc_1.equals(SongPart_BREAKDOWN_getInstance()));
    var introDropOk = unprepared && toNumber(subtract(now, this.rc_1)) > 16 * barMs;
    var blockedByCorrection = this.nd_1 || (forced && !this.md_1) || (compare(this.de_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.de_1)) < PartyTuning_getInstance().gc_1 * barMs);
    var mayDrop = !lockedOut && !afterFake && !blockedByCorrection && (this.he_1 || introDropOk || this.lc_1.equals(SongPart_BUILDUP_getInstance()) || this.lc_1.equals(SongPart_BREAKDOWN_getInstance()) || this.lc_1.equals(SongPart_VOCAL_getInstance()) || this.lc_1.equals(SongPart_ANTI_CLIMAX_getInstance()));
    var backFromDip = this.tc_1 - this.ed_1 >= 6.0 && this.tc_1 >= this.dd_1 - 3.0;
    var hit = unprepared ? backFromDip : subHitRel >= 6.0 || backFromDip;
    if (mayDrop && hit && f.z8_1 > 8.0 && compare(subtract(now, this.id_1), new Long(300, 0)) < 0) {
      this.le_1 = now;
      var tmp_17 = this;
      var tmp0_5 = this.vc_1;
      // Inline function 'kotlin.comparisons.minOf' call
      var b_5 = this.ed_1 + 3.0;
      tmp_17.me_1 = Math.min(tmp0_5, b_5);
      this.ne_1 = this.tc_1;
      this.mc_1 = DropKind_PENDING_getInstance();
      this.ie_1 = true;
      this.ld_1 = new Long(0, 0);
      voteBoundary(this, f.b9_1);
      enter(this, SongPart_DROP_getInstance(), now, fmt('sub +%.1f dB', [subHitRel]));
    } else {
      var next = (compare(new Long(0, 0), remainingMs) <= 0 ? compare(remainingMs, numberToLong(16 * barMs)) <= 0 : false) && compare(subtract(now, this.rc_1), new Long(30000, 0)) > 0 ? SongPart_OUTRO_getInstance() : compare(this.je_1, new Long(0, 0)) > 0 && compare(subtract(now, this.je_1), new Long(2000, 0)) >= 0 ? SongPart_BUILDUP_getInstance() : this.lc_1.equals(SongPart_BUILDUP_getInstance()) && compare(this.je_1, new Long(0, 0)) > 0 ? SongPart_BUILDUP_getInstance() : this.he_1 && (this.lc_1.equals(SongPart_BUILDUP_getInstance()) || this.lc_1.equals(SongPart_BREAKDOWN_getInstance()) || this.lc_1.equals(SongPart_ANTI_CLIMAX_getInstance())) && f.w8_1 > 0.35 && subRel < -2.0 && !kickGone && this.yc_1 > 0.25 ? SongPart_ANTI_CLIMAX_getInstance() : kickGone && !this.lc_1.equals(SongPart_INTRO_getInstance()) ? f.a9_1 > 3.0 && f.j8_1 > 0.08 ? SongPart_VOCAL_getInstance() : SongPart_BREAKDOWN_getInstance() : kickGone && this.lc_1.equals(SongPart_INTRO_getInstance()) && compare(subtract(now, this.rc_1), new Long(8000, 0)) > 0 ? SongPart_BREAKDOWN_getInstance() : !this.ie_1 ? SongPart_INTRO_getInstance() : SongPart_BREAKDOWN_getInstance();
      if (!forced && !next.equals(this.lc_1) && compare(subtract(now, this.sc_1), numberToLong(barMs)) >= 0) {
        enter(this, next, now, 'takt-bevis');
        if (next.equals(SongPart_BREAKDOWN_getInstance()) && !kickGone)
          this.he_1 = false;
      }
    }
  }
  var tmp0_6 = get_indices(this.ue_1);
  var tmp$ret$14;
  $l$block_0: {
    // Inline function 'kotlin.collections.maxByOrNull' call
    var iterator = tmp0_6.j();
    if (!iterator.k()) {
      tmp$ret$14 = null;
      break $l$block_0;
    }
    var maxElem = iterator.l();
    if (!iterator.k()) {
      tmp$ret$14 = maxElem;
      break $l$block_0;
    }
    var it = maxElem;
    var maxValue = this.ue_1[it];
    do {
      var e_0 = iterator.l();
      var v = this.ue_1[e_0];
      if (compareTo(maxValue, v) < 0) {
        maxElem = e_0;
        maxValue = v;
      }
    }
     while (iterator.k());
    tmp$ret$14 = maxElem;
  }
  var tmp2_elvis_lhs = tmp$ret$14;
  var phase = tmp2_elvis_lhs == null ? 0 : tmp2_elvis_lhs;
  var pos = (((f.b9_1 - phase | 0) % 32 | 0) + 32 | 0) % 32 | 0;
  var barInPhrase = (pos / 4 | 0) + 1 | 0;
  // Inline function 'kotlin.floorDiv' call
  var this_2 = f.b9_1 - phase | 0;
  var q = this_2 / 32 | 0;
  if ((this_2 ^ 32) < 0 && !(imul_0(q, 32) === this_2)) {
    q = q - 1 | 0;
  }
  var phrase = q + 1 | 0;
  var tmp_18;
  switch (this.lc_1.z_1) {
    case 4:
      var tmp_19;
      if (this.mc_1.equals(DropKind_PENDING_getInstance())) {
        tmp_19 = 'DROP?';
      } else {
        // Inline function 'kotlin.text.ifBlank' call
        var this_3 = this.mc_1.pb_1;
        var tmp_20;
        if (isBlank(this_3)) {
          tmp_20 = 'DROP';
        } else {
          tmp_20 = this_3;
        }
        tmp_19 = tmp_20;
      }

      tmp_18 = tmp_19;
      break;
    case 3:
      tmp_18 = fmt('BUILD-UP %.0f%%', [build * 100.0]);
      break;
    case 1:
      tmp_18 = 'BREAKDOWN (SYNG?)';
      break;
    default:
      // Inline function 'kotlin.text.uppercase' call

      // Inline function 'kotlin.js.asDynamic' call

      tmp_18 = this.lc_1.mb_1.toUpperCase();
      break;
  }
  var partName = tmp_18;
  this.pc_1 = new StructureHud(partName, barInPhrase, phrase, this.he_1, subRel, airTrend, build, this.yc_1, f.w8_1, this.lc_1.equals(SongPart_VOCAL_getInstance()), f.r8_1);
  var bar = f.b9_1 / 4 | 0;
  if (!(bar === this.ve_1)) {
    this.ve_1 = bar;
    RaveLog_getInstance().fb('RaveGenre', fmt('takt %d/8 frase %d | %s | sub %+.1f dB (treff %+.1f) diskant %+.1f dB build %.0f%% grit %.2f snare/s %.1f klar=%b', [barInPhrase, phrase, partName, subRel, subHitRel, airTrend, build * 100.0, this.yc_1, this.fd_1, this.he_1]));
  }
  var boost = this.re_1;
  var tmp_21;
  switch (this.lc_1.z_1) {
    case 0:
      tmp_21 = 0.4;
      break;
    case 2:
    case 1:
      tmp_21 = 0.5;
      break;
    case 3:
      tmp_21 = coerceIn_0(0.55 + build * 0.25, 0.55, 0.8);
      break;
    case 4:
      var tmp_22;
      switch (this.mc_1.z_1) {
        case 1:
          tmp_22 = 0.9;
          break;
        case 2:
          tmp_22 = 0.9 + boost;
          break;
        case 3:
          tmp_22 = 1.0 + boost;
          break;
        case 4:
          tmp_22 = 1.2 + boost;
          break;
        case 0:
          tmp_22 = 1.0;
          break;
        default:
          noWhenBranchMatchedException();
          break;
      }

      tmp_21 = tmp_22;
      break;
    case 5:
      tmp_21 = 0.55;
      break;
    case 7:
      tmp_21 = 0.6;
      break;
    case 6:
      tmp_21 = 0.35;
      break;
    default:
      noWhenBranchMatchedException();
      break;
  }
  var target = tmp_21;
  var rate = target > this.se_1 && this.lc_1.equals(SongPart_DROP_getInstance()) ? 0.05 : 0.6;
  var tmp_23 = this;
  var tmp_24 = this.se_1;
  var tmp_25 = target - this.se_1;
  // Inline function 'kotlin.math.exp' call
  var x_3 = -dt / rate;
  tmp_23.se_1 = tmp_24 + tmp_25 * (1.0 - Math.exp(x_3));
  return this.se_1;
};
var static_init_called_2;
function static_init_2() {
  if (static_init_called_2)
    return Unit_instance;
  static_init_called_2 = true;
  HardSub_EUPHORIC_instance = new HardSub('EUPHORIC', 0, 'EUFORISK', 0.6, 0.6, 0.9, 1.0, 0.0);
  HardSub_RAW_instance = new HardSub('RAW', 1, 'RAW', 1.0, 1.0, 1.0, 1.0, 1.3);
  HardSub_HARDCORE_instance = new HardSub('HARDCORE', 2, 'HARDCORE', 1.1, 0.9, 1.0, 1.1, 1.0);
  HardSub_UPTEMPO_instance = new HardSub('UPTEMPO', 3, 'UPTEMPO', 0.9, 0.8, 1.0, 1.2, 0.8);
  HardSub_FRENCHCORE_instance = new HardSub('FRENCHCORE', 4, 'FRENCHCORE', 0.8, 0.7, 1.0, 1.3, 0.7);
}
var HardSub_EUPHORIC_instance;
var HardSub_RAW_instance;
var HardSub_HARDCORE_instance;
var HardSub_UPTEMPO_instance;
var HardSub_FRENCHCORE_instance;
function HardSub(name, ordinal, label, shake, strobe, spike, particles, screech) {
  Enum.call(this, name, ordinal);
  this.bf_1 = label;
  this.cf_1 = shake;
  this.df_1 = strobe;
  this.ef_1 = spike;
  this.ff_1 = particles;
  this.gf_1 = screech;
}
function HardSubDetector() {
  this.hf_1 = HardSub_RAW_getInstance();
  this.if_1 = new Long(0, 0);
  this.jf_1 = new Float32Array(12);
  this.kf_1 = 0;
  this.lf_1 = 0;
  this.mf_1 = new Long(0, 0);
  this.nf_1 = 0.0;
  this.of_1 = 0.0;
  this.pf_1 = 0.0;
  this.qf_1 = new Long(0, 0);
  this.rf_1 = HardSub_RAW_getInstance();
  this.sf_1 = new Long(0, 0);
  this.tf_1 = false;
  this.uf_1 = null;
}
protoOf(HardSubDetector).vf = function () {
  this.kf_1 = 0;
  this.lf_1 = 0;
  this.nf_1 = 0.0;
  this.of_1 = 0.0;
  this.tf_1 = false;
  this.uf_1 = null;
};
protoOf(HardSubDetector).jb = function (f, now) {
  var tmp;
  if (equalsLong(this.qf_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.qf_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn_0(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.qf_1 = now;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / 8.0;
  var d = Math.exp(x);
  this.nf_1 = this.nf_1 * d + f.q8_1 * (1.0 - d);
  this.of_1 = this.of_1 * d + f.w8_1 * (1.0 - d);
  this.pf_1 = this.pf_1 * d + f.h9_1 * (1.0 - d);
  if (f.r8_1 > 0.0 && compare(subtract(now, this.mf_1), new Long(1000, 0)) >= 0) {
    this.mf_1 = now;
    this.jf_1[this.lf_1] = f.r8_1;
    this.lf_1 = (this.lf_1 + 1 | 0) % this.jf_1.length | 0;
    var tmp_0 = this;
    var tmp0 = this.kf_1 + 1 | 0;
    // Inline function 'kotlin.comparisons.minOf' call
    var b = this.jf_1.length;
    tmp_0.kf_1 = Math.min(tmp0, b);
  }
  if (!(this.uf_1 == null))
    return this.hf_1;
  if (this.kf_1 < 5)
    return this.hf_1;
  var bpm = sorted(copyOf_1(this.jf_1, this.kf_1)).n(this.kf_1 / 2 | 0);
  var guess = bpm >= 222.0 ? HardSub_FRENCHCORE_getInstance() : bpm >= 188.0 ? HardSub_UPTEMPO_getInstance() : bpm >= 162.0 ? HardSub_HARDCORE_getInstance() : this.pf_1 > 0.5 && this.nf_1 < 0.35 ? HardSub_EUPHORIC_getInstance() : this.nf_1 > 0.22 || this.of_1 > 0.08 ? HardSub_RAW_getInstance() : HardSub_EUPHORIC_getInstance();
  if (!guess.equals(this.rf_1)) {
    this.rf_1 = guess;
    this.sf_1 = now;
  }
  var needed = this.tf_1 ? new Long(40000, 0) : new Long(12000, 0);
  if (!this.rf_1.equals(this.hf_1) && compare(subtract(now, this.sf_1), needed) >= 0 || (!this.tf_1 && this.rf_1.equals(this.hf_1) && compare(subtract(now, this.sf_1), new Long(12000, 0)) >= 0)) {
    this.tf_1 = true;
    if (this.rf_1.equals(this.hf_1))
      return this.hf_1;
    this.hf_1 = this.rf_1;
    this.if_1 = now;
    RaveLog_getInstance().fb('RaveGenre', fmt('undersjanger \u2192 ' + this.hf_1.bf_1 + ' (bpm=%.0f grit=%.2f screech=%.2f)', [bpm, this.nf_1, this.of_1]));
  }
  return this.hf_1;
};
function blendFrames$l($t, x, y) {
  return x + (y - x) * $t;
}
function Genre_HARDSTYLE_getInstance() {
  static_init();
  return Genre_HARDSTYLE_instance;
}
function Genre_RAP_getInstance() {
  static_init();
  return Genre_RAP_instance;
}
function Genre_ROCK_getInstance() {
  static_init();
  return Genre_ROCK_instance;
}
function Genre_EDM_getInstance() {
  static_init();
  return Genre_EDM_instance;
}
function Genre_STANDARD_getInstance() {
  static_init();
  return Genre_STANDARD_instance;
}
function Genre_POP_getInstance() {
  static_init();
  return Genre_POP_instance;
}
function Genre_REGGAE_getInstance() {
  static_init();
  return Genre_REGGAE_instance;
}
function Genre_REGGAETON_getInstance() {
  static_init();
  return Genre_REGGAETON_instance;
}
function SongPart_INTRO_getInstance() {
  static_init_0();
  return SongPart_INTRO_instance;
}
function SongPart_VOCAL_getInstance() {
  static_init_0();
  return SongPart_VOCAL_instance;
}
function SongPart_BREAKDOWN_getInstance() {
  static_init_0();
  return SongPart_BREAKDOWN_instance;
}
function SongPart_BUILDUP_getInstance() {
  static_init_0();
  return SongPart_BUILDUP_instance;
}
function SongPart_DROP_getInstance() {
  static_init_0();
  return SongPart_DROP_instance;
}
function SongPart_GROOVE_getInstance() {
  static_init_0();
  return SongPart_GROOVE_instance;
}
function SongPart_OUTRO_getInstance() {
  static_init_0();
  return SongPart_OUTRO_instance;
}
function SongPart_ANTI_CLIMAX_getInstance() {
  static_init_0();
  return SongPart_ANTI_CLIMAX_instance;
}
function DropKind_NONE_getInstance() {
  static_init_1();
  return DropKind_NONE_instance;
}
function DropKind_PENDING_getInstance() {
  static_init_1();
  return DropKind_PENDING_instance;
}
function DropKind_FIRST_getInstance() {
  static_init_1();
  return DropKind_FIRST_instance;
}
function DropKind_MIDDLE_getInstance() {
  static_init_1();
  return DropKind_MIDDLE_instance;
}
function DropKind_LAST_getInstance() {
  static_init_1();
  return DropKind_LAST_instance;
}
function HardSub_EUPHORIC_getInstance() {
  static_init_2();
  return HardSub_EUPHORIC_instance;
}
function HardSub_RAW_getInstance() {
  static_init_2();
  return HardSub_RAW_instance;
}
function HardSub_HARDCORE_getInstance() {
  static_init_2();
  return HardSub_HARDCORE_instance;
}
function HardSub_UPTEMPO_getInstance() {
  static_init_2();
  return HardSub_UPTEMPO_instance;
}
function HardSub_FRENCHCORE_getInstance() {
  static_init_2();
  return HardSub_FRENCHCORE_instance;
}
var properties_initialized_GenreDetector_kt_v6qdkp;
function _init_properties_GenreDetector_kt__z0odbr() {
  if (!properties_initialized_GenreDetector_kt_v6qdkp) {
    properties_initialized_GenreDetector_kt_v6qdkp = true;
    CALM_LOCK = setOf_0([Genre_POP_getInstance(), Genre_STANDARD_getInstance(), Genre_REGGAE_getInstance(), Genre_REGGAETON_getInstance()]);
  }
}
function HardstyleFrame(bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit) {
  bass = bass === VOID ? 0.0 : bass;
  kick = kick === VOID ? 0.0 : kick;
  highs = highs === VOID ? 0.0 : highs;
  energy = energy === VOID ? 0.0 : energy;
  burst = burst === VOID ? 0.0 : burst;
  build = build === VOID ? 0.0 : build;
  spectrum = spectrum === VOID ? get_SILENT_SPECTRUM() : spectrum;
  highMotion = highMotion === VOID ? 0.0 : highMotion;
  heavy = heavy === VOID ? 0.0 : heavy;
  grit = grit === VOID ? 0.0 : grit;
  bpm = bpm === VOID ? 0.0 : bpm;
  snare = snare === VOID ? 0.0 : snare;
  crash = crash === VOID ? 0.0 : crash;
  sub = sub === VOID ? 0.0 : sub;
  level = level === VOID ? 0.0 : level;
  screech = screech === VOID ? 0.0 : screech;
  bassLevel = bassLevel === VOID ? 0.0 : bassLevel;
  air = air === VOID ? 0.0 : air;
  subLevel = subLevel === VOID ? 0.0 : subLevel;
  presence = presence === VOID ? 0.0 : presence;
  beat = beat === VOID ? 0 : beat;
  beatAt = beatAt === VOID ? new Long(0, 0) : beatAt;
  beatPeriod = beatPeriod === VOID ? 0.0 : beatPeriod;
  beatConfidence = beatConfidence === VOID ? 0 : beatConfidence;
  noise = noise === VOID ? 0.0 : noise;
  centroid = centroid === VOID ? 0.0 : centroid;
  offbeat = offbeat === VOID ? 0.0 : offbeat;
  vocal = vocal === VOID ? 0.0 : vocal;
  vocalHit = vocalHit === VOID ? 0.0 : vocalHit;
  this.h8_1 = bass;
  this.i8_1 = kick;
  this.j8_1 = highs;
  this.k8_1 = energy;
  this.l8_1 = burst;
  this.m8_1 = build;
  this.n8_1 = spectrum;
  this.o8_1 = highMotion;
  this.p8_1 = heavy;
  this.q8_1 = grit;
  this.r8_1 = bpm;
  this.s8_1 = snare;
  this.t8_1 = crash;
  this.u8_1 = sub;
  this.v8_1 = level;
  this.w8_1 = screech;
  this.x8_1 = bassLevel;
  this.y8_1 = air;
  this.z8_1 = subLevel;
  this.a9_1 = presence;
  this.b9_1 = beat;
  this.c9_1 = beatAt;
  this.d9_1 = beatPeriod;
  this.e9_1 = beatConfidence;
  this.f9_1 = noise;
  this.g9_1 = centroid;
  this.h9_1 = offbeat;
  this.i9_1 = vocal;
  this.j9_1 = vocalHit;
}
protoOf(HardstyleFrame).wf = function (bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit) {
  return new HardstyleFrame(bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit);
};
protoOf(HardstyleFrame).x9 = function (bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit, $super) {
  bass = bass === VOID ? this.h8_1 : bass;
  kick = kick === VOID ? this.i8_1 : kick;
  highs = highs === VOID ? this.j8_1 : highs;
  energy = energy === VOID ? this.k8_1 : energy;
  burst = burst === VOID ? this.l8_1 : burst;
  build = build === VOID ? this.m8_1 : build;
  spectrum = spectrum === VOID ? this.n8_1 : spectrum;
  highMotion = highMotion === VOID ? this.o8_1 : highMotion;
  heavy = heavy === VOID ? this.p8_1 : heavy;
  grit = grit === VOID ? this.q8_1 : grit;
  bpm = bpm === VOID ? this.r8_1 : bpm;
  snare = snare === VOID ? this.s8_1 : snare;
  crash = crash === VOID ? this.t8_1 : crash;
  sub = sub === VOID ? this.u8_1 : sub;
  level = level === VOID ? this.v8_1 : level;
  screech = screech === VOID ? this.w8_1 : screech;
  bassLevel = bassLevel === VOID ? this.x8_1 : bassLevel;
  air = air === VOID ? this.y8_1 : air;
  subLevel = subLevel === VOID ? this.z8_1 : subLevel;
  presence = presence === VOID ? this.a9_1 : presence;
  beat = beat === VOID ? this.b9_1 : beat;
  beatAt = beatAt === VOID ? this.c9_1 : beatAt;
  beatPeriod = beatPeriod === VOID ? this.d9_1 : beatPeriod;
  beatConfidence = beatConfidence === VOID ? this.e9_1 : beatConfidence;
  noise = noise === VOID ? this.f9_1 : noise;
  centroid = centroid === VOID ? this.g9_1 : centroid;
  offbeat = offbeat === VOID ? this.h9_1 : offbeat;
  vocal = vocal === VOID ? this.i9_1 : vocal;
  vocalHit = vocalHit === VOID ? this.j9_1 : vocalHit;
  return $super === VOID ? this.wf(bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit) : $super.wf.call(this, bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit);
};
protoOf(HardstyleFrame).toString = function () {
  return 'HardstyleFrame(bass=' + this.h8_1 + ', kick=' + this.i8_1 + ', highs=' + this.j8_1 + ', energy=' + this.k8_1 + ', burst=' + this.l8_1 + ', build=' + this.m8_1 + ', spectrum=' + toString_1(this.n8_1) + ', highMotion=' + this.o8_1 + ', heavy=' + this.p8_1 + ', grit=' + this.q8_1 + ', bpm=' + this.r8_1 + ', snare=' + this.s8_1 + ', crash=' + this.t8_1 + ', sub=' + this.u8_1 + ', level=' + this.v8_1 + ', screech=' + this.w8_1 + ', bassLevel=' + this.x8_1 + ', air=' + this.y8_1 + ', subLevel=' + this.z8_1 + ', presence=' + this.a9_1 + ', beat=' + this.b9_1 + ', beatAt=' + this.c9_1.toString() + ', beatPeriod=' + this.d9_1 + ', beatConfidence=' + this.e9_1 + ', noise=' + this.f9_1 + ', centroid=' + this.g9_1 + ', offbeat=' + this.h9_1 + ', vocal=' + this.i9_1 + ', vocalHit=' + this.j9_1 + ')';
};
protoOf(HardstyleFrame).hashCode = function () {
  var result = getNumberHashCode(this.h8_1);
  result = imul_0(result, 31) + getNumberHashCode(this.i8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.j8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.k8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.l8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.m8_1) | 0;
  result = imul_0(result, 31) + hashCode_0(this.n8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.o8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.p8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.q8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.r8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.s8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.t8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.u8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.v8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.w8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.x8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.y8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.z8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.a9_1) | 0;
  result = imul_0(result, 31) + this.b9_1 | 0;
  result = imul_0(result, 31) + this.c9_1.hashCode() | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.d9_1) | 0;
  result = imul_0(result, 31) + this.e9_1 | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.f9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.g9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.h9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.i9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.j9_1) | 0;
  return result;
};
protoOf(HardstyleFrame).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof HardstyleFrame))
    return false;
  if (!equals(this.h8_1, other.h8_1))
    return false;
  if (!equals(this.i8_1, other.i8_1))
    return false;
  if (!equals(this.j8_1, other.j8_1))
    return false;
  if (!equals(this.k8_1, other.k8_1))
    return false;
  if (!equals(this.l8_1, other.l8_1))
    return false;
  if (!equals(this.m8_1, other.m8_1))
    return false;
  if (!equals(this.n8_1, other.n8_1))
    return false;
  if (!equals(this.o8_1, other.o8_1))
    return false;
  if (!equals(this.p8_1, other.p8_1))
    return false;
  if (!equals(this.q8_1, other.q8_1))
    return false;
  if (!equals(this.r8_1, other.r8_1))
    return false;
  if (!equals(this.s8_1, other.s8_1))
    return false;
  if (!equals(this.t8_1, other.t8_1))
    return false;
  if (!equals(this.u8_1, other.u8_1))
    return false;
  if (!equals(this.v8_1, other.v8_1))
    return false;
  if (!equals(this.w8_1, other.w8_1))
    return false;
  if (!equals(this.x8_1, other.x8_1))
    return false;
  if (!equals(this.y8_1, other.y8_1))
    return false;
  if (!equals(this.z8_1, other.z8_1))
    return false;
  if (!equals(this.a9_1, other.a9_1))
    return false;
  if (!(this.b9_1 === other.b9_1))
    return false;
  if (!equalsLong(this.c9_1, other.c9_1))
    return false;
  if (!equals(this.d9_1, other.d9_1))
    return false;
  if (!(this.e9_1 === other.e9_1))
    return false;
  if (!equals(this.f9_1, other.f9_1))
    return false;
  if (!equals(this.g9_1, other.g9_1))
    return false;
  if (!equals(this.h9_1, other.h9_1))
    return false;
  if (!equals(this.i9_1, other.i9_1))
    return false;
  if (!equals(this.j9_1, other.j9_1))
    return false;
  return true;
};
function accept$smooth(dt, old, target, seconds) {
  var tmp = target - old;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / seconds;
  return old + tmp * (1 - Math.exp(x));
}
function HardstyleAudio() {
  this.xf_1 = new HardstyleSpectrum();
  this.yf_1 = 8.0;
  this.zf_1 = 0.0;
  this.ag_1 = 0.0;
  this.bg_1 = new Long(0, 0);
  this.cg_1 = new Long(-1000, -1);
  this.dg_1 = new Long(-5000, -1);
  this.eg_1 = 0.0;
  this.fg_1 = 0.0;
  this.gg_1 = 0.0;
  this.hg_1 = 0.0;
  this.ig_1 = 0.0;
  this.jg_1 = new Long(-1000, -1);
  this.kg_1 = 0.0;
  this.lg_1 = 0.0;
  this.mg_1 = new Long(-1000, -1);
  this.ng_1 = 0.0;
  this.og_1 = 0.0;
  this.pg_1 = 0.0;
  this.qg_1 = 0.0;
  this.rg_1 = 0.0;
  this.sg_1 = 0.0;
  this.tg_1 = new Long(-1000, -1);
  this.ug_1 = new BeatTracker();
  this.vg_1 = 0.0;
  this.wg_1 = new Long(-1000, -1);
  this.xg_1 = new HardstyleFrame();
}
protoOf(HardstyleAudio).f8 = function () {
  this.xf_1.f8();
  this.yf_1 = 8.0;
  this.zf_1 = 0.0;
  this.ag_1 = 0.0;
  this.bg_1 = new Long(0, 0);
  this.cg_1 = new Long(-1000, -1);
  this.dg_1 = new Long(-5000, -1);
  this.eg_1 = 0.0;
  this.fg_1 = 0.0;
  this.gg_1 = 0.0;
  this.rg_1 = 0.0;
  this.sg_1 = 0.0;
  this.tg_1 = new Long(-1000, -1);
  this.hg_1 = 0.0;
  this.ig_1 = 0.0;
  this.jg_1 = new Long(-1000, -1);
  this.kg_1 = 0.0;
  this.lg_1 = 0.0;
  this.mg_1 = new Long(-1000, -1);
  this.ng_1 = 0.0;
  this.og_1 = 0.0;
  this.pg_1 = 0.0;
  this.qg_1 = 0.0;
  this.ug_1.f8();
  this.vg_1 = 0.0;
  this.wg_1 = new Long(-1000, -1);
  this.xg_1 = new HardstyleFrame();
};
protoOf(HardstyleAudio).ph = function (fft, sampleRate, now) {
  if (sampleRate <= 0 || fft.length < 4)
    return new HardstyleFrame();
  var low = 0.0;
  var bass = 0.0;
  var high = 0.0;
  var mid = 0.0;
  var snareBand = 0.0;
  var air = 0.0;
  var scr = 0.0;
  var nl = 0;
  var nb = 0;
  var nh = 0;
  var nm = 0;
  var ns = 0;
  var na = 0;
  var nsc = 0;
  var flatLog = 0.0;
  var flatSum = 0.0;
  var nf = 0;
  var centNum = 0.0;
  var centDen = 0.0;
  var voice = 0.0;
  var voiceLog = 0.0;
  var nv = 0;
  var inductionVariable = 1;
  var last = fft.length / 2 | 0;
  if (inductionVariable < last)
    do {
      var k = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var hz = k * sampleRate / fft.length;
      var tmp0 = fft[imul_0(2, k)];
      // Inline function 'kotlin.math.hypot' call
      var y = fft[imul_0(2, k) + 1 | 0];
      var magnitude = hypot(tmp0, y);
      if (2000.0 <= hz ? hz <= 12000.0 : false) {
        var tmp = flatLog;
        // Inline function 'kotlin.math.ln' call
        var x = magnitude + 1.0;
        flatLog = tmp + Math.log(x);
        flatSum = flatSum + (magnitude + 1.0);
        nf = nf + 1 | 0;
      }
      if (250.0 <= hz ? hz <= 12000.0 : false) {
        centNum = centNum + hz * magnitude;
        centDen = centDen + magnitude;
      }
      if (rangeUntil(30.0, 90.0).h7(hz)) {
        low = low + magnitude;
        nl = nl + 1 | 0;
      } else if (rangeUntil(90.0, 250.0).h7(hz)) {
        bass = bass + magnitude;
        nb = nb + 1 | 0;
      } else if (250.0 <= hz ? hz <= 8000.0 : false) {
        high = high + magnitude;
        nh = nh + 1 | 0;
      }
      if (250.0 <= hz ? hz <= 2500.0 : false) {
        mid = mid + magnitude;
        nm = nm + 1 | 0;
      }
      if (1000.0 <= hz ? hz <= 4000.0 : false) {
        snareBand = snareBand + magnitude;
        ns = ns + 1 | 0;
      }
      if (6000.0 <= hz ? hz <= 12000.0 : false) {
        air = air + magnitude;
        na = na + 1 | 0;
      }
      if (1200.0 <= hz ? hz <= 5000.0 : false) {
        scr = scr + magnitude;
        nsc = nsc + 1 | 0;
      }
      if (300.0 <= hz ? hz <= 3400.0 : false) {
        voice = voice + magnitude;
        var tmp_0 = voiceLog;
        // Inline function 'kotlin.math.ln' call
        var x_0 = 1.0 + magnitude;
        voiceLog = tmp_0 + Math.log(x_0);
        nv = nv + 1 | 0;
      }
    }
     while (inductionVariable < last);
  var tmp_1 = low;
  // Inline function 'kotlin.math.max' call
  var b = nl;
  low = tmp_1 / Math.max(1, b);
  var tmp_2 = bass;
  // Inline function 'kotlin.math.max' call
  var b_0 = nb;
  bass = tmp_2 / Math.max(1, b_0);
  var tmp_3 = high;
  // Inline function 'kotlin.math.max' call
  var b_1 = nh;
  high = tmp_3 / Math.max(1, b_1);
  var tmp_4 = mid;
  // Inline function 'kotlin.math.max' call
  var b_2 = nm;
  mid = tmp_4 / Math.max(1, b_2);
  var tmp_5 = snareBand;
  // Inline function 'kotlin.math.max' call
  var b_3 = ns;
  snareBand = tmp_5 / Math.max(1, b_3);
  var tmp_6 = air;
  // Inline function 'kotlin.math.max' call
  var b_4 = na;
  air = tmp_6 / Math.max(1, b_4);
  var tmp_7 = scr;
  // Inline function 'kotlin.math.max' call
  var b_5 = nsc;
  scr = tmp_7 / Math.max(1, b_5);
  var tmp_8 = voice;
  // Inline function 'kotlin.math.max' call
  var b_6 = nv;
  voice = tmp_8 / Math.max(1, b_6);
  var tmp_9;
  if (voice > 1.0) {
    var tmp_10 = voiceLog;
    // Inline function 'kotlin.math.max' call
    var b_7 = nv;
    // Inline function 'kotlin.math.exp' call
    var x_1 = tmp_10 / Math.max(1, b_7);
    var tmp$ret$12 = Math.exp(x_1);
    tmp_9 = coerceIn_0(1.0 - (tmp$ret$12 - 1.0) / voice, 0.0, 1.0);
  } else {
    tmp_9 = 0.0;
  }
  var tonality = tmp_9;
  var tmp0_0 = low;
  // Inline function 'kotlin.math.max' call
  var b_8 = bass;
  var value = Math.max(tmp0_0, b_8);
  var tmp_11;
  if (equalsLong(this.bg_1, new Long(0, 0))) {
    tmp_11 = 0.016;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.bg_1);
    var tmp$ret$14 = toNumber(this_0) / 1000.0;
    tmp_11 = coerceIn_0(tmp$ret$14, 0.001, 0.2);
  }
  var dt = tmp_11;
  this.bg_1 = now;
  var tmp_12 = this;
  var tmp_13 = this.yf_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 3.0;
  // Inline function 'kotlin.math.max' call
  var b_9 = tmp_13 * Math.exp(x_2);
  // Inline function 'kotlin.math.max' call
  var b_10 = Math.max(value, b_9);
  tmp_12.yf_1 = Math.max(8.0, b_10);
  var tmp_14 = this;
  var tmp_15;
  if (value > this.og_1) {
    var tmp_16 = this.og_1;
    var tmp_17 = value - this.og_1;
    // Inline function 'kotlin.math.exp' call
    var x_3 = -dt / 2.0;
    tmp_15 = tmp_16 + tmp_17 * (1.0 - Math.exp(x_3));
  } else {
    var tmp_18 = this.og_1;
    // Inline function 'kotlin.math.exp' call
    var x_4 = -dt / 25.0;
    tmp_15 = tmp_18 * Math.exp(x_4);
  }
  tmp_14.og_1 = tmp_15;
  var tmp0_1 = this.yf_1;
  // Inline function 'kotlin.math.max' call
  var b_11 = this.og_1 * 0.55;
  var reference = Math.max(tmp0_1, b_11);
  var norm = value < 2.0 || value < this.og_1 * 0.1 ? 0.0 : coerceIn_0(value / (reference * 1.3), 0.0, 1.0);
  var flatWeight = nf > 0 ? coerceIn_0((flatSum / nf - 2.0) / 3.0, 0.0, 1.0) : 0.0;
  var tmp_19;
  if (flatWeight > 0.0) {
    // Inline function 'kotlin.math.exp' call
    var x_5 = flatLog / nf;
    var tmp$ret$21 = Math.exp(x_5);
    tmp_19 = coerceIn_0(tmp$ret$21 / (flatSum / nf), 0.0, 1.0) * flatWeight;
  } else {
    tmp_19 = 0.0;
  }
  var noise = tmp_19;
  var centroid = centDen > 1.0 ? centNum / centDen : 0.0;
  var onset = value > 3.0 && value > this.ag_1 * 1.12 && value > this.zf_1 * 1.15 && compare(subtract(now, this.cg_1), new Long(120, 0)) >= 0;
  if (onset) {
    var gap = toNumber(subtract(now, this.cg_1));
    if (250.0 <= gap ? gap <= 1500.0 : false)
      this.gg_1 = this.gg_1 === 0.0 ? gap : this.gg_1 * 0.85 + gap * 0.15;
    this.cg_1 = now;
  }
  var snareOnset = snareBand > 3.0 && snareBand > this.hg_1 * 1.45 && snareBand > this.ig_1 * 1.15 && compare(subtract(now, this.jg_1), new Long(90, 0)) >= 0;
  if (snareOnset)
    this.jg_1 = now;
  var vocalOnset = voice > 2.5 && tonality > 0.35 && voice > this.rg_1 * 1.3 && voice > this.sg_1 * 1.12 && !onset && !snareOnset && compare(subtract(now, this.cg_1), new Long(80, 0)) > 0 && this.xg_1.w8_1 < 0.3 && compare(subtract(now, this.tg_1), new Long(180, 0)) >= 0;
  if (vocalOnset)
    this.tg_1 = now;
  var crashOnset = air > 2.0 && air > this.kg_1 * 1.8 && air > this.lg_1 * 1.3 && compare(subtract(now, this.mg_1), new Long(400, 0)) >= 0;
  if (crashOnset)
    this.mg_1 = now;
  // Inline function 'kotlin.math.max' call
  var b_12 = value - this.ag_1;
  var flux = Math.max(0.0, b_12);
  var tmp_20;
  var tmp_21;
  if (value > 3.0) {
    // Inline function 'kotlin.math.max' call
    var b_13 = this.vg_1 * 1.6;
    tmp_21 = flux > Math.max(1.5, b_13);
  } else {
    tmp_21 = false;
  }
  if (tmp_21) {
    tmp_20 = compare(subtract(now, this.wg_1), new Long(100, 0)) >= 0;
  } else {
    tmp_20 = false;
  }
  var candidate = tmp_20;
  if (candidate)
    this.wg_1 = now;
  this.vg_1 = this.vg_1 * 0.9 + flux * 0.1;
  if (onset && this.ug_1.ih_1 > 0.0 && compare(this.ug_1.jh_1, new Long(0, 0)) > 0 && this.ug_1.lh_1 >= 3) {
    var phase = toNumber(modulo(subtract(now, this.ug_1.jh_1), numberToLong(this.ug_1.ih_1))) / this.ug_1.ih_1;
    var off = (0.4 <= phase ? phase <= 0.6 : false) ? 1.0 : 0.0;
    this.qg_1 = this.qg_1 * 0.92 + off * 0.08;
  }
  var beat = this.ug_1.qh(now, candidate || onset, norm > 0.3, norm > 0.55);
  var burst = onset && norm > 0.55 && this.xg_1.k8_1 < 0.35 && compare(subtract(now, this.dg_1), new Long(1800, 0)) >= 0;
  if (burst)
    this.dg_1 = now;
  this.eg_1 = accept$smooth(dt, this.eg_1, value, 0.3);
  this.fg_1 = this.fg_1 === 0.0 ? value : accept$smooth(dt, this.fg_1, value, 12.0);
  var bassPresent = this.og_1 > 0.0 ? coerceIn_0((value / this.og_1 - 0.45) / 0.3, 0.0, 1.0) : 0.0;
  var tmp_22 = mid;
  // Inline function 'kotlin.math.max' call
  var tmp$ret$24 = Math.max(value, 12.0);
  var gritNow = coerceIn_0((tmp_22 / tmp$ret$24 - 0.35) / 0.5, 0.0, 1.0) * coerceIn_0(value / 20.0, 0.0, 1.0) * bassPresent;
  var tmp0_2 = this.cg_1;
  // Inline function 'kotlin.math.max' call
  var b_14 = this.ug_1.jh_1;
  var anchor = compare(tmp0_2, b_14) >= 0 ? tmp0_2 : b_14;
  var sinceKick = subtract(now, anchor);
  var tmp_23;
  if (compare(sinceKick, new Long(600, 0)) > 0) {
    var tmp_24 = this.pg_1;
    // Inline function 'kotlin.math.exp' call
    var x_6 = -dt / 0.3;
    tmp_23 = tmp_24 * Math.exp(x_6);
  } else if (compare(new Long(50, 0), sinceKick) <= 0 ? compare(sinceKick, new Long(250, 0)) <= 0 : false) {
    tmp_23 = gritNow;
  } else {
    var tmp_25 = this.pg_1;
    // Inline function 'kotlin.math.exp' call
    var x_7 = -dt / 0.6;
    tmp_23 = tmp_25 * Math.exp(x_7);
  }
  var grit = tmp_23;
  this.pg_1 = grit;
  var tmp_26 = this.eg_1;
  // Inline function 'kotlin.math.max' call
  var b_15 = this.fg_1;
  var tmp$ret$28 = Math.max(4.0, b_15);
  var lift = coerceIn_0((tmp_26 / tmp$ret$28 - 1.0) / 0.8, 0.0, 1.0);
  var loudRel = this.og_1 > 0.0 ? coerceIn_0((this.eg_1 / this.og_1 - 0.45) / 0.45, 0.0, 1.0) : 0.0;
  var heavyRaw = norm * norm * (0.4 * grit + 0.15 * lift + 0.25 * loudRel + 0.2 * norm);
  var heavyTarget = coerceIn_0((heavyRaw - 0.12) / 0.4, 0.0, 1.0);
  var tmp_27 = this;
  var tmp_28 = accept$smooth(dt, this.xg_1.h8_1, norm, norm > this.xg_1.h8_1 ? 0.025 : 0.18);
  var tmp_29;
  if (beat) {
    tmp_29 = this.ug_1.rh() ? 0.85 : 1.0;
  } else if (onset) {
    var tmp_30 = this.xg_1.i8_1;
    // Inline function 'kotlin.math.exp' call
    var x_8 = -dt / 0.085;
    // Inline function 'kotlin.math.max' call
    var b_16 = tmp_30 * Math.exp(x_8);
    tmp_29 = Math.max(0.7, b_16);
  } else {
    var tmp_31 = this.xg_1.i8_1;
    // Inline function 'kotlin.math.exp' call
    var x_9 = -dt / 0.085;
    tmp_29 = tmp_31 * Math.exp(x_9);
  }
  var tmp_32 = tmp_29;
  var tmp_33 = this.xg_1.j8_1;
  var tmp_34 = high;
  // Inline function 'kotlin.math.max' call
  var b_17 = this.yf_1;
  var tmp$ret$32 = Math.max(8.0, b_17);
  var tmp_35 = accept$smooth(dt, tmp_33, coerceIn_0(tmp_34 / tmp$ret$32, 0.0, 1.0), 0.08);
  var tmp_36 = accept$smooth(dt, this.xg_1.k8_1, norm, 0.8);
  var tmp_37;
  if (burst) {
    tmp_37 = 1.0;
  } else {
    var tmp_38 = this.xg_1.l8_1;
    // Inline function 'kotlin.math.exp' call
    var x_10 = -dt / 0.35;
    tmp_37 = tmp_38 * Math.exp(x_10);
  }
  var tmp_39 = tmp_37;
  var tmp_40 = accept$smooth(dt, this.xg_1.m8_1, burst || this.xg_1.l8_1 > 0.1 ? 0.0 : coerceIn_0((norm - this.xg_1.k8_1) / 0.35, 0.0, 1.0), 0.3);
  var tmp_41 = this.xf_1.sh(fft, sampleRate, dt);
  var tmp_42 = this.xf_1.dh_1;
  var tmp_43 = accept$smooth(dt, this.xg_1.p8_1, heavyTarget, heavyTarget > this.xg_1.p8_1 ? 0.02 : 0.5);
  var tmp_44 = accept$smooth(dt, this.xg_1.q8_1, grit, grit > this.xg_1.q8_1 ? 0.02 : 0.25);
  var tmp_45 = this.ug_1.ih_1 > 0.0 ? 60000.0 / this.ug_1.ih_1 : 0.0;
  var tmp_46;
  if (snareOnset) {
    tmp_46 = 1.0;
  } else {
    var tmp_47 = this.xg_1.s8_1;
    // Inline function 'kotlin.math.exp' call
    var x_11 = -dt / 0.09;
    tmp_46 = tmp_47 * Math.exp(x_11);
  }
  var tmp_48 = tmp_46;
  var tmp_49;
  if (crashOnset) {
    tmp_49 = 1.0;
  } else {
    var tmp_50 = this.xg_1.t8_1;
    // Inline function 'kotlin.math.exp' call
    var x_12 = -dt / 0.18;
    tmp_49 = tmp_50 * Math.exp(x_12);
  }
  var tmp_51 = tmp_49;
  var tmp_52 = this.xg_1.u8_1;
  var tmp_53;
  if (value > 3.0) {
    var tmp_54 = low;
    // Inline function 'kotlin.math.max' call
    var b_18 = low + bass;
    var tmp$ret$36 = Math.max(1.0, b_18);
    tmp_53 = coerceIn_0(tmp_54 / tmp$ret$36, 0.0, 1.0);
  } else {
    tmp_53 = this.xg_1.u8_1;
  }
  var tmp_55 = accept$smooth(dt, tmp_52, tmp_53, 0.4);
  var tmp_56 = value + mid;
  // Inline function 'kotlin.run' call
  var target = scr > 3.0 && this.ng_1 > 0.0 ? coerceIn_0((scr / this.ng_1 - 1.5) / 1.2, 0.0, 1.0) : 0.0;
  var tmp_57 = accept$smooth(dt, this.xg_1.w8_1, target, target > this.xg_1.w8_1 ? 0.12 : 0.3);
  var tmp_58 = air;
  var tmp_59 = low;
  var tmp_60 = scr;
  var tmp_61 = this.ug_1.oh_1;
  var tmp_62 = this.ug_1.jh_1;
  var tmp_63 = this.ug_1.ih_1;
  var tmp_64 = this.ug_1.lh_1;
  var tmp_65 = accept$smooth(dt, this.xg_1.f9_1, noise, 0.3);
  var tmp_66 = accept$smooth(dt, this.xg_1.g9_1, centroid, 0.3);
  var tmp_67 = this.qg_1;
  // Inline function 'kotlin.run' call
  var target_0 = voice > 2.0 && this.rg_1 > 0.0 ? coerceIn_0((voice / this.rg_1 - 1.0) / 0.6, 0.0, 1.0) * coerceIn_0((tonality - 0.25) / 0.35, 0.0, 1.0) * (1.0 - this.xg_1.w8_1) : 0.0;
  var tmp_68 = accept$smooth(dt, this.xg_1.i9_1, target_0, target_0 > this.xg_1.i9_1 ? 0.08 : 0.4);
  var tmp_69;
  if (vocalOnset) {
    tmp_69 = 1.0;
  } else {
    var tmp_70 = this.xg_1.j9_1;
    // Inline function 'kotlin.math.exp' call
    var x_13 = -dt / 0.3;
    tmp_69 = tmp_70 * Math.exp(x_13);
  }
  tmp_27.xg_1 = new HardstyleFrame(tmp_28, tmp_32, tmp_35, tmp_36, tmp_39, tmp_40, tmp_41, tmp_42, tmp_43, tmp_44, tmp_45, tmp_48, tmp_51, tmp_55, tmp_56, tmp_57, value, tmp_58, tmp_59, tmp_60, tmp_61, tmp_62, tmp_63, tmp_64, tmp_65, tmp_66, tmp_67, tmp_68, tmp_69);
  this.zf_1 = accept$smooth(dt, this.zf_1, value, 0.5);
  this.ag_1 = value;
  this.rg_1 = this.rg_1 === 0.0 ? voice : accept$smooth(dt, this.rg_1, voice, 8.0);
  this.sg_1 = voice;
  this.ng_1 = this.ng_1 === 0.0 ? scr : accept$smooth(dt, this.ng_1, scr, 6.0);
  this.hg_1 = accept$smooth(dt, this.hg_1, snareBand, 0.6);
  this.ig_1 = snareBand;
  this.kg_1 = accept$smooth(dt, this.kg_1, air, 0.8);
  this.lg_1 = air;
  return this.xg_1;
};
function addOnset($this, now) {
  $this.eh_1[$this.gh_1] = now;
  $this.gh_1 = ($this.gh_1 + 1 | 0) % $this.eh_1.length | 0;
  var tmp = $this;
  var tmp0 = $this.fh_1 + 1 | 0;
  // Inline function 'kotlin.comparisons.minOf' call
  var b = $this.eh_1.length;
  tmp.fh_1 = Math.min(tmp0, b);
  fill_0($this.hh_1, 0.0);
  var inductionVariable = 0;
  var last = $this.fh_1;
  if (inductionVariable < last)
    $l$loop: do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var a = $this.eh_1[i];
      if (compare(subtract(now, a), new Long(6000, 0)) > 0)
        continue $l$loop;
      var inductionVariable_0 = 0;
      var last_0 = $this.fh_1;
      if (inductionVariable_0 < last_0)
        $l$loop_0: do {
          var j = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var d = toNumber(subtract($this.eh_1[j], a));
          if (d <= 0.0 || d > 1600.0)
            continue $l$loop_0;
          var inductionVariable_1 = 1;
          if (inductionVariable_1 <= 3)
            $l$loop_1: do {
              var k = inductionVariable_1;
              inductionVariable_1 = inductionVariable_1 + 1 | 0;
              var p = d / k;
              if (p < 240.0 || p >= 530.0)
                continue $l$loop_1;
              var _array__4zh2yp = $this.hh_1;
              var _index_0__fvwizt = numberToInt((p - 240.0) / 10.0);
              _array__4zh2yp[_index_0__fvwizt] = _array__4zh2yp[_index_0__fvwizt] + 1.0 / k;
            }
             while (inductionVariable_1 <= 3);
        }
         while (inductionVariable_0 < last_0);
    }
     while (inductionVariable < last);
  var best = -1;
  var bestScore = 0.0;
  var inductionVariable_2 = 0;
  var last_1 = $this.hh_1.length - 1 | 0;
  if (inductionVariable_2 <= last_1)
    do {
      var b_0 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      var score = addOnset$score($this, b_0);
      if (score > bestScore) {
        bestScore = score;
        best = b_0;
      }
    }
     while (inductionVariable_2 <= last_1);
  var hinted = false;
  if ($this.nh_1 > 0.0 && best >= 0) {
    // Inline function 'kotlin.math.roundToInt' call
    var this_0 = ($this.nh_1 - 245.0) / 10.0;
    var tmp$ret$1 = roundToInt(this_0);
    var hb = coerceIn(tmp$ret$1, 0, $this.hh_1.length - 1 | 0);
    var hBest = -1;
    var hScore = 0.0;
    var inductionVariable_3 = hb - 2 | 0;
    var last_2 = hb + 2 | 0;
    if (inductionVariable_3 <= last_2)
      do {
        var b_1 = inductionVariable_3;
        inductionVariable_3 = inductionVariable_3 + 1 | 0;
        if ((0 <= b_1 ? b_1 <= ($this.hh_1.length - 1 | 0) : false) && addOnset$score($this, b_1) > hScore) {
          hScore = addOnset$score($this, b_1);
          hBest = b_1;
        }
      }
       while (!(b_1 === last_2));
    if (hBest >= 0 && $this.fh_1 >= 6 && hScore >= 2.5 && hScore >= bestScore * 0.3) {
      best = hBest;
      // Inline function 'kotlin.comparisons.maxOf' call
      var a_0 = bestScore;
      bestScore = Math.max(a_0, 3.0);
      hinted = true;
    }
  }
  if (best >= 0 && bestScore >= 3.0) {
    if (best < 4 && !hinted) {
      var double = imul_0(best, 2) + 24 | 0;
      if (double < $this.hh_1.length && $this.hh_1[double] >= $this.hh_1[best] * 0.5)
        best = double;
    }
    var estimate = 245.0 + best * 10.0;
    $this.ih_1 = $this.ih_1 === 0.0 ? estimate : $this.ih_1 * 0.8 + estimate * 0.2;
  }
}
function addOnset$score(this$0, b) {
  var tmp = this$0.hh_1[b];
  var tmp0 = this$0.hh_1;
  // Inline function 'kotlin.collections.getOrElse' call
  var index = b - 1 | 0;
  var tmp_0;
  if (0 <= index ? index <= (tmp0.length - 1 | 0) : false) {
    tmp_0 = tmp0[index];
  } else {
    tmp_0 = 0.0;
  }
  var tmp_1 = tmp_0;
  var tmp0_0 = this$0.hh_1;
  // Inline function 'kotlin.collections.getOrElse' call
  var index_0 = b + 1 | 0;
  var tmp_2;
  if (0 <= index_0 ? index_0 <= (tmp0_0.length - 1 | 0) : false) {
    tmp_2 = tmp0_0[index_0];
  } else {
    tmp_2 = 0.0;
  }
  return tmp + 0.5 * (tmp_1 + tmp_2);
}
function BeatTracker() {
  this.eh_1 = longArray(48);
  this.fh_1 = 0;
  this.gh_1 = 0;
  this.hh_1 = new Float32Array(29);
  this.ih_1 = 0.0;
  this.jh_1 = new Long(0, 0);
  this.kh_1 = new Long(0, 0);
  this.lh_1 = 0;
  this.mh_1 = 0;
  this.nh_1 = 0.0;
  this.oh_1 = 0;
}
protoOf(BeatTracker).rh = function () {
  return this.mh_1 > 2;
};
protoOf(BeatTracker).f8 = function () {
  this.fh_1 = 0;
  this.gh_1 = 0;
  this.ih_1 = 0.0;
  this.jh_1 = new Long(0, 0);
  this.kh_1 = new Long(0, 0);
  this.lh_1 = 0;
  this.mh_1 = 0;
  this.oh_1 = 0;
};
protoOf(BeatTracker).qh = function (now, onset, bassPresent, strongBass) {
  var beat = false;
  if (onset) {
    addOnset(this, now);
    this.kh_1 = now;
    if (this.ih_1 > 0.0 && compare(this.jh_1, new Long(0, 0)) > 0) {
      var since = toNumber(subtract(now, this.jh_1));
      var err = (since + this.ih_1 / 2.0) % this.ih_1 - this.ih_1 / 2.0;
      // Inline function 'kotlin.math.abs' call
      if (Math.abs(err) < this.ih_1 * 0.22) {
        if (since > this.ih_1 * 0.5) {
          beat = true;
          var tmp = this;
          // Inline function 'kotlin.comparisons.minOf' call
          var a = this.lh_1 + 1 | 0;
          tmp.lh_1 = Math.min(a, 8);
          this.mh_1 = 0;
        }
        this.jh_1 = now;
      } else {
        if (this.lh_1 < 2) {
          beat = true;
          this.jh_1 = now;
        }
      }
    } else {
      beat = true;
      this.jh_1 = now;
    }
  }
  if (!beat && this.ih_1 > 0.0 && compare(this.jh_1, new Long(0, 0)) > 0 && this.lh_1 >= 3 && bassPresent && this.mh_1 < (strongBass ? 8 : 2) && toNumber(subtract(now, this.jh_1)) >= this.ih_1 - 25.0) {
    beat = true;
    this.jh_1 = add(this.jh_1, numberToLong(this.ih_1));
    if (!strongBass || (this.mh_1 % 4 | 0) === 0)
      this.lh_1 = this.lh_1 - 1 | 0;
    this.mh_1 = this.mh_1 + 1 | 0;
  }
  if (this.ih_1 > 0.0 && compare(this.jh_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.jh_1)) > this.ih_1 * 2.5)
    this.lh_1 = 0;
  if (beat) {
    this.oh_1 = this.oh_1 + 1 | 0;
  }
  return beat;
};
function get_SILENT_SPECTRUM() {
  _init_properties_HardstyleSpectrum_kt__r0hi3f();
  return SILENT_SPECTRUM;
}
var SILENT_SPECTRUM;
function accept$magnitude(lastBin, $fft, bin) {
  var tmp;
  if (1 <= bin ? bin <= lastBin : false) {
    var tmp0 = $fft[imul_0(bin, 2)];
    // Inline function 'kotlin.math.hypot' call
    var y = $fft[imul_0(bin, 2) + 1 | 0];
    tmp = hypot(tmp0, y);
  } else {
    tmp = 0.0;
  }
  return tmp;
}
function HardstyleSpectrum() {
  this.yg_1 = new Float32Array(48);
  this.zg_1 = new Float32Array(48);
  this.ah_1 = new Float32Array(48);
  this.bh_1 = 8.0;
  this.ch_1 = 0.0;
  this.dh_1 = 0.0;
}
protoOf(HardstyleSpectrum).f8 = function () {
  fill_0(this.yg_1, 0.0);
  fill_0(this.zg_1, 0.0);
  fill_0(this.ah_1, 0.0);
  this.bh_1 = 8.0;
  this.ch_1 = 0.0;
  this.dh_1 = 0.0;
};
protoOf(HardstyleSpectrum).sh = function (fft, sampleRate, dt) {
  var binHz = sampleRate / fft.length;
  var lastBin = (fft.length / 2 | 0) - 1 | 0;
  var inductionVariable = 0;
  var last = this.zg_1.length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      // Inline function 'kotlin.math.pow' call
      var x = i / 47;
      var hz = 40.0 * Math.pow(100.0, x);
      var position = hz / binHz;
      // Inline function 'kotlin.math.floor' call
      var tmp$ret$1 = Math.floor(position);
      var lower = numberToInt(tmp$ret$1);
      var fraction = position - lower;
      var value = accept$magnitude(lastBin, fft, lower) * (1.0 - fraction) + accept$magnitude(lastBin, fft, lower + 1 | 0) * fraction;
      // Inline function 'kotlin.math.pow' call
      var x_0 = 0.5 / 47;
      var halfWidth = Math.pow(100.0, x_0);
      // Inline function 'kotlin.math.ceil' call
      var x_1 = hz / halfWidth / binHz;
      var tmp$ret$3 = Math.ceil(x_1);
      // Inline function 'kotlin.math.max' call
      var b = numberToInt(tmp$ret$3);
      var start = Math.max(1, b);
      // Inline function 'kotlin.math.floor' call
      var x_2 = hz * halfWidth / binHz;
      var tmp$ret$5 = Math.floor(x_2);
      // Inline function 'kotlin.math.min' call
      var b_0 = numberToInt(tmp$ret$5);
      var end = Math.min(lastBin, b_0);
      var inductionVariable_0 = start;
      if (inductionVariable_0 <= end)
        do {
          var bin = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var tmp0 = value;
          // Inline function 'kotlin.math.max' call
          var b_1 = accept$magnitude(lastBin, fft, bin);
          value = Math.max(tmp0, b_1);
        }
         while (!(bin === end));
      var tmp;
      if (hz >= sampleRate / 2.0) {
        tmp = 0.0;
      } else {
        // Inline function 'kotlin.math.max' call
        var b_2 = value - 2.0;
        tmp = Math.max(0.0, b_2);
      }
      this.zg_1[i] = tmp;
    }
     while (inductionVariable <= last);
  var positiveFlux = 0.0;
  var inductionVariable_1 = 32;
  if (inductionVariable_1 < 48)
    do {
      var i_0 = inductionVariable_1;
      inductionVariable_1 = inductionVariable_1 + 1 | 0;
      var tmp_0 = positiveFlux;
      // Inline function 'kotlin.math.max' call
      var b_3 = this.zg_1[i_0] - this.ah_1[i_0];
      positiveFlux = tmp_0 + Math.max(0.0, b_3);
    }
     while (inductionVariable_1 < 48);
  var tmp_1 = this;
  var tmp_2 = positiveFlux / 16.0;
  // Inline function 'kotlin.math.max' call
  var b_4 = this.bh_1;
  var tmp$ret$10 = Math.max(8.0, b_4);
  tmp_1.dh_1 = coerceIn_0(tmp_2 / tmp$ret$10 * 3.0, 0.0, 1.0);
  var tmp0_0 = this.zg_1;
  // Inline function 'kotlin.collections.copyInto' call
  var destination = this.ah_1;
  var endIndex = tmp0_0.length;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_3 = tmp0_0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp_3, destination, 0, 0, endIndex);
  var tmp0_elvis_lhs = maxOrNull(this.zg_1);
  var loudest = tmp0_elvis_lhs == null ? 0.0 : tmp0_elvis_lhs;
  var tmp_4 = this;
  var tmp_5;
  if (loudest > this.ch_1) {
    var tmp_6 = this.ch_1;
    var tmp_7 = loudest - this.ch_1;
    // Inline function 'kotlin.math.exp' call
    var x_3 = -dt / 2.0;
    tmp_5 = tmp_6 + tmp_7 * (1.0 - Math.exp(x_3));
  } else {
    var tmp_8 = this.ch_1;
    // Inline function 'kotlin.math.exp' call
    var x_4 = -dt / 25.0;
    tmp_5 = tmp_8 * Math.exp(x_4);
  }
  tmp_4.ch_1 = tmp_5;
  var tmp_9 = this;
  var tmp_10 = this.bh_1;
  // Inline function 'kotlin.math.exp' call
  var x_5 = -dt / 3.0;
  var tmp2 = tmp_10 * Math.exp(x_5);
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = this.ch_1 * 0.55;
  // Inline function 'kotlin.math.max' call
  var b_5 = Math.max(loudest, tmp2, c);
  tmp_9.bh_1 = Math.max(8.0, b_5);
  var inductionVariable_2 = 0;
  var last_0 = this.yg_1.length - 1 | 0;
  if (inductionVariable_2 <= last_0)
    do {
      var i_1 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      // Inline function 'kotlin.math.max' call
      var b_6 = i_1 - 1 | 0;
      var tmp$ret$21 = Math.max(0, b_6);
      var tmp_11 = this.zg_1[tmp$ret$21] * 0.15 + this.zg_1[i_1] * 0.7;
      var tmp0_1 = get_lastIndex_2(this.zg_1);
      // Inline function 'kotlin.math.min' call
      var b_7 = i_1 + 1 | 0;
      var tmp$ret$22 = Math.min(tmp0_1, b_7);
      var neighbor = tmp_11 + this.zg_1[tmp$ret$22] * 0.15;
      var ratio = neighbor / this.bh_1;
      // Inline function 'kotlin.math.ln' call
      var x_6 = 1.0 + 3.0 * ratio;
      var tmp_12 = Math.log(x_6);
      // Inline function 'kotlin.math.ln' call
      var tmp$ret$24 = Math.log(5.0);
      var target = coerceIn_0(tmp_12 / tmp$ret$24, 0.0, 1.0);
      var seconds = target > this.yg_1[i_1] ? 0.01 : 0.07;
      var _array__4zh2yp = this.yg_1;
      var tmp_13 = _array__4zh2yp[i_1];
      var tmp_14 = target - this.yg_1[i_1];
      // Inline function 'kotlin.math.exp' call
      var x_7 = -dt / seconds;
      _array__4zh2yp[i_1] = tmp_13 + tmp_14 * (1.0 - Math.exp(x_7));
      if (this.yg_1[i_1] < 1.0E-4) {
        this.yg_1[i_1] = 0.0;
      }
    }
     while (inductionVariable_2 <= last_0);
  return toList(this.yg_1);
};
var properties_initialized_HardstyleSpectrum_kt_p97tt3;
function _init_properties_HardstyleSpectrum_kt__r0hi3f() {
  if (!properties_initialized_HardstyleSpectrum_kt_p97tt3) {
    properties_initialized_HardstyleSpectrum_kt_p97tt3 = true;
    // Inline function 'kotlin.collections.List' call
    // Inline function 'kotlin.collections.MutableList' call
    var list = ArrayList_init_$Create$_0(48);
    // Inline function 'kotlin.repeat' call
    var inductionVariable = 0;
    if (inductionVariable < 48)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        list.i(0.0);
      }
       while (inductionVariable < 48);
    SILENT_SPECTRUM = list;
  }
}
function fft($this, re, im) {
  var n = re.length;
  var j = 0;
  var inductionVariable = 1;
  if (inductionVariable < n)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var bit = n >> 1;
      while (!((j & bit) === 0)) {
        j = j ^ bit;
        bit = bit >> 1;
      }
      j = j ^ bit;
      if (i < j) {
        var t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
     while (inductionVariable < n);
  var len = 2;
  while (len <= n) {
    var ang = -2.0 * 3.141592653589793 / len;
    // Inline function 'kotlin.math.cos' call
    var wr = Math.cos(ang);
    // Inline function 'kotlin.math.sin' call
    var wi = Math.sin(ang);
    var i_0 = 0;
    while (i_0 < n) {
      var cr = 1.0;
      var ci = 0.0;
      var inductionVariable_0 = 0;
      var last = len / 2 | 0;
      if (inductionVariable_0 < last)
        do {
          var k = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var ar = re[(i_0 + k | 0) + (len / 2 | 0) | 0] * cr - im[(i_0 + k | 0) + (len / 2 | 0) | 0] * ci;
          var ai = re[(i_0 + k | 0) + (len / 2 | 0) | 0] * ci + im[(i_0 + k | 0) + (len / 2 | 0) | 0] * cr;
          re[(i_0 + k | 0) + (len / 2 | 0) | 0] = re[i_0 + k | 0] - ar;
          im[(i_0 + k | 0) + (len / 2 | 0) | 0] = im[i_0 + k | 0] - ai;
          var _index_0__fvwizt = i_0 + k | 0;
          re[_index_0__fvwizt] = re[_index_0__fvwizt] + ar;
          var _index_0__fvwizt_0 = i_0 + k | 0;
          im[_index_0__fvwizt_0] = im[_index_0__fvwizt_0] + ai;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr;
          cr = ncr;
        }
         while (inductionVariable_0 < last);
      i_0 = i_0 + len | 0;
    }
    len = len << 1;
  }
}
function push$b(scale, v) {
  // Inline function 'kotlin.math.roundToInt' call
  var this_0 = v * scale;
  var tmp$ret$0 = roundToInt(this_0);
  return toByte(coerceIn(tmp$ret$0, -128, 127));
}
function PcmFft(size) {
  this.th_1 = size;
  this.uh_1 = this.th_1 / 2 | 0;
  var tmp = this;
  var tmp_0 = 0;
  var tmp_1 = this.th_1;
  var tmp_2 = new Float32Array(tmp_1);
  while (tmp_0 < tmp_1) {
    var tmp_3 = tmp_0;
    // Inline function 'kotlin.math.cos' call
    var x = 2.0 * 3.141592653589793 * tmp_3 / (this.th_1 - 1 | 0);
    tmp_2[tmp_3] = 0.5 - 0.5 * Math.cos(x);
    tmp_0 = tmp_0 + 1 | 0;
  }
  tmp.vh_1 = tmp_2;
  this.wh_1 = new Float32Array(this.th_1);
  this.xh_1 = new Float32Array(this.th_1);
  this.yh_1 = new Float32Array(this.th_1);
  this.zh_1 = new Int8Array(this.th_1);
  this.ai_1 = 1.0;
}
protoOf(PcmFft).bi = function (samples, rateHz) {
  var tmp0 = this.wh_1;
  var tmp2 = this.wh_1;
  var tmp6 = this.uh_1;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex = this.th_1;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp, tmp2, 0, tmp6, endIndex);
  var inductionVariable = 0;
  var last = this.uh_1;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      this.wh_1[(this.th_1 - this.uh_1 | 0) + i | 0] = samples[i];
    }
     while (inductionVariable < last);
  var inductionVariable_0 = 0;
  var last_0 = this.th_1;
  if (inductionVariable_0 < last_0)
    do {
      var i_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      this.xh_1[i_0] = this.wh_1[i_0] * this.vh_1[i_0];
      this.yh_1[i_0] = 0.0;
    }
     while (inductionVariable_0 < last_0);
  fft(this, this.xh_1, this.yh_1);
  var frameMax = 0.0;
  var inductionVariable_1 = 1;
  var last_1 = this.th_1 / 2 | 0;
  if (inductionVariable_1 < last_1)
    do {
      var k = inductionVariable_1;
      inductionVariable_1 = inductionVariable_1 + 1 | 0;
      var tmp0_0 = frameMax;
      var tmp0_1 = this.xh_1[k];
      // Inline function 'kotlin.math.hypot' call
      var y = this.yh_1[k];
      // Inline function 'kotlin.math.max' call
      var b = hypot(tmp0_1, y);
      frameMax = Math.max(tmp0_0, b);
    }
     while (inductionVariable_1 < last_1);
  var tmp_0 = this;
  var tmp0_2 = frameMax;
  var tmp_1 = this.ai_1;
  // Inline function 'kotlin.math.exp' call
  var x = -(this.uh_1 / rateHz) / 30.0;
  // Inline function 'kotlin.math.max' call
  var b_0 = tmp_1 * Math.exp(x);
  // Inline function 'kotlin.math.max' call
  var b_1 = Math.max(0.001, b_0);
  tmp_0.ai_1 = Math.max(tmp0_2, b_1);
  var scale = 100.0 / this.ai_1;
  this.zh_1[0] = push$b(scale, this.xh_1[0]);
  this.zh_1[1] = push$b(scale, this.xh_1[this.th_1 / 2 | 0]);
  var inductionVariable_2 = 1;
  var last_2 = this.th_1 / 2 | 0;
  if (inductionVariable_2 < last_2)
    do {
      var k_0 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      this.zh_1[imul_0(2, k_0)] = push$b(scale, this.xh_1[k_0]);
      this.zh_1[imul_0(2, k_0) + 1 | 0] = push$b(scale, this.yh_1[k_0]);
    }
     while (inductionVariable_2 < last_2);
  // Inline function 'kotlin.collections.copyOf' call
  // Inline function 'kotlin.js.asDynamic' call
  return this.zh_1.slice();
};
function RaveLog$sink$lambda(_unused_var__etf5q3, _unused_var__etf5q3_0) {
  return Unit_instance;
}
function RaveLog() {
  RaveLog_instance = this;
  var tmp = this;
  tmp.eb_1 = RaveLog$sink$lambda;
}
protoOf(RaveLog).fb = function (tag, message) {
  return this.eb_1(tag, message);
};
var RaveLog_instance;
function RaveLog_getInstance() {
  if (RaveLog_instance == null)
    new RaveLog();
  return RaveLog_instance;
}
function get_LISTENER_FEATURES() {
  _init_properties_SongListener_kt__8i8fex();
  return LISTENER_FEATURES;
}
var LISTENER_FEATURES;
function get_MODEL_BASE() {
  _init_properties_SongListener_kt__8i8fex();
  return MODEL_BASE;
}
var MODEL_BASE;
function get_MODEL_LAGS() {
  _init_properties_SongListener_kt__8i8fex();
  return MODEL_LAGS;
}
var MODEL_LAGS;
function resetSlot($this) {
  $this.zi_1 = 0.0;
  $this.aj_1 = 0.0;
  $this.bj_1 = 0.0;
  $this.cj_1 = 0.0;
  $this.dj_1 = 0.0;
  $this.ej_1 = 0;
  $this.fj_1 = 0;
  $this.gj_1 = 0;
}
function fold($this, b) {
  var x = b;
  while (x >= 200.0)
    x = x / 2.0;
  while (x < 100.0)
    x = x * 2.0;
  return x;
}
function nextSlotMs($this) {
  var tmp0 = $this.mj_1;
  // Inline function 'kotlin.comparisons.minOf' call
  var b = $this.lj_1.length;
  var n = Math.min(tmp0, b);
  if (n < 8)
    return $this.kj_1;
  // Inline function 'kotlin.also' call
  var this_0 = copyOf_1($this.lj_1, n);
  sort(this_0);
  var med = this_0[n / 2 | 0];
  var want = 60000.0 / med;
  var tmp;
  // Inline function 'kotlin.math.abs' call
  var x = want - $this.kj_1;
  if (Math.abs(x) > $this.kj_1 * 0.03) {
    tmp = want;
  } else {
    tmp = $this.kj_1;
  }
  return tmp;
}
function db_0($this, x) {
  // Inline function 'kotlin.math.max' call
  // Inline function 'kotlin.math.log10' call
  var x_0 = Math.max(x, 2.5);
  return 20.0 * log10(x_0);
}
function closeSlot($this, pos, dur, now) {
  // Inline function 'kotlin.math.max' call
  var a = $this.ej_1;
  var n = Math.max(a, 1);
  $this.si_1.i(db_0($this, $this.bj_1 / n));
  $this.ti_1.i(db_0($this, $this.cj_1 / n));
  $this.ui_1.i(db_0($this, $this.dj_1 / n));
  $this.vi_1.i($this.zi_1 / n);
  $this.wi_1.i($this.aj_1 / n);
  $this.xi_1.i($this.fj_1);
  $this.yi_1.i($this.gj_1);
  var c = $this.si_1.m();
  $this.ri_1[0] = $this.si_1.n(c - 1 | 0);
  $this.ri_1[1] = $this.ti_1.n(c - 1 | 0);
  $this.ri_1[2] = $this.ui_1.n(c - 1 | 0);
  $this.ri_1[3] = $this.fj_1;
  $this.ri_1[4] = $this.gj_1;
  $this.uj_1 = $this.uj_1 + 1 | 0;
  if (c < 16) {
    setPart($this, SongPart_INTRO_getInstance(), pos, now, dur);
    return Unit_instance;
  }
  if ((c - $this.pj_1 | 0) < 10)
    return Unit_instance;
  var ss = sorted_0($this.si_1);
  var p10 = ss.n(numberToInt(c * 0.1));
  var p90 = ss.n(coerceAtMost(numberToInt(c * 0.9), c - 1 | 0));
  var range = p90 - p10;
  var sRange = p90 - p10;
  var aS = sorted_0($this.ti_1);
  var aRange = aS.n(coerceAtMost(numberToInt(c * 0.9), c - 1 | 0)) - aS.n(numberToInt(c * 0.1));
  var pS = sorted_0($this.ui_1);
  var pRange = pS.n(coerceAtMost(numberToInt(c * 0.9), c - 1 | 0)) - pS.n(numberToInt(c * 0.1));
  var curSub = closeSlot$mean($this.si_1, c - 2 | 0, c);
  var posSub = closeSlot$posS(p10, sRange, curSub);
  var posNow = closeSlot$full($this, p10, sRange, aS, c, aRange, pS, pRange, c - 2 | 0, c);
  var posPre = closeSlot$full($this, p10, sRange, aS, c, aRange, pS, pRange, (c - 2 | 0) - 4 | 0, c - 2 | 0);
  var barPos = closeSlot$full($this, p10, sRange, aS, c, aRange, pS, pRange, c - 4 | 0, c);
  var kickNow = sum(takeLast($this.xi_1, 2));
  var kickBar = sum(takeLast($this.xi_1, 4));
  var curAir = closeSlot$mean($this.ti_1, c - 2 | 0, c);
  var curPres = closeSlot$mean($this.ui_1, c - 2 | 0, c);
  $this.gi_1 = (closeSlot$rank(c, $this.si_1, curSub) + closeSlot$rank(c, $this.ti_1, curAir) + closeSlot$rank(c, $this.ui_1, curPres)) / 3.0;
  var airRise = (curAir - closeSlot$mean($this.ti_1, (c - 2 | 0) - 4 | 0, c - 2 | 0)) / coerceAtLeast_1(aRange, 1.0);
  var presRise = (curPres - closeSlot$mean($this.ui_1, (c - 2 | 0) - 4 | 0, c - 2 | 0)) / coerceAtLeast_1(pRange, 1.0);
  var snareNow = sum(takeLast($this.yi_1, 4));
  var snareBefore = sum($this.yi_1.d2(c - 8 | 0, c - 4 | 0));
  var snareRise = snareNow >= 3 && snareNow >= snareBefore * 1.5;
  var nS = sorted_0($this.vi_1);
  var cS = sorted_0($this.wi_1);
  var noiseRise = (closeSlot$mean($this.vi_1, c - 2 | 0, c) - closeSlot$mean($this.vi_1, (c - 2 | 0) - 4 | 0, c - 2 | 0)) / coerceAtLeast_1(nS.n(coerceAtMost(numberToInt(c * 0.9), c - 1 | 0)) - nS.n(numberToInt(c * 0.1)), 0.02);
  var centRise = (closeSlot$mean($this.wi_1, c - 2 | 0, c) - closeSlot$mean($this.wi_1, (c - 2 | 0) - 4 | 0, c - 2 | 0)) / coerceAtLeast_1(cS.n(coerceAtMost(numberToInt(c * 0.9), c - 1 | 0)) - cS.n(numberToInt(c * 0.1)), 0.05);
  var signs = ((airRise > 0.15 || presRise > 0.15 ? 1 : 0) + (snareRise ? 1 : 0) | 0) + (noiseRise > 0.15 || centRise > 0.15 ? 1 : 0) | 0;
  var rising = signs >= 2;
  $this.ki_1[0] = posSub;
  $this.ki_1[1] = posNow;
  $this.ki_1[2] = posPre;
  $this.ki_1[3] = posNow - posPre;
  $this.ki_1[4] = airRise;
  $this.ki_1[5] = presRise;
  $this.ki_1[6] = noiseRise;
  $this.ki_1[7] = centRise;
  $this.ki_1[8] = snareNow;
  $this.ki_1[9] = snareNow / (snareBefore + 1.0);
  $this.ki_1[10] = kickNow;
  $this.ki_1[11] = $this.gi_1;
  $this.ki_1[12] = range;
  $this.ki_1[13] = posSub - closeSlot$posS(p10, sRange, closeSlot$mean($this.si_1, (c - 2 | 0) - 4 | 0, c - 2 | 0));
  $this.ki_1[14] = closeSlot$posA(aS, c, aRange, curAir);
  $this.ki_1[15] = closeSlot$posP(pS, c, pRange, curPres);
  runModel($this);
  var buildEvidence = range >= 3.0 && posSub < 0.55 && rising;
  var tmp = $this;
  var tmp_0;
  if (range < 3.0) {
    tmp_0 = 0.0;
  } else {
    var tmp_1 = coerceIn_0((0.55 - posSub) / 0.55, 0.0, 1.0) * 0.5;
    // Inline function 'kotlin.math.max' call
    var tmp$ret$1 = Math.max(airRise, presRise);
    tmp_0 = tmp_1 + coerceIn_0(tmp$ret$1 / (2 * 0.15), 0.0, 1.0) * 0.5;
  }
  tmp.hi_1 = tmp_0;
  var buildSlots = $this.uj_1;
  var expectDrop = $this.ci_1.equals(SongPart_BUILDUP_getInstance()) && $this.wj_1 > 0 && buildSlots >= ($this.wj_1 - 2 | 0);
  var jumpNeeded = expectDrop ? 0.18 : 0.25;
  $this.ni_1 = jumpNeeded;
  var jump = posNow - posPre;
  $this.ii_1 = range < 3.0 ? 0.0 : coerceIn_0(jump / jumpNeeded, 0.0, 1.0) * (kickNow > 0 ? 1.0 : 0.3);
  var fromBuild = $this.ci_1.equals(SongPart_BUILDUP_getInstance());
  var hit = range >= 3.0 && posNow >= 0.6 && jump >= jumpNeeded && kickNow >= 1 && !$this.ci_1.equals(SongPart_DROP_getInstance()) && (fromBuild || $this.uj_1 >= 8 || $this.ji_1 === 0);
  $this.nj_1 = hit ? $this.nj_1 + 1 | 0 : 0;
  var dropHit = $this.nj_1 >= 2 || (hit && jump >= jumpNeeded * 2.0);
  $this.sj_1 = buildEvidence ? $this.sj_1 + 1 | 0 : 0;
  $this.tj_1 = buildEvidence ? 0 : $this.tj_1 + 1 | 0;
  if ($this.ci_1.equals(SongPart_DROP_getInstance())) {
    $this.qj_1 = $this.qj_1 + (barPos - $this.qj_1) * 0.05;
    var fell = $this.uj_1 >= 8 && (barPos < $this.qj_1 - 0.35 || kickBar === 0);
    $this.rj_1 = fell ? $this.rj_1 + 1 | 0 : 0;
    if ($this.rj_1 >= 4) {
      setPart($this, buildEvidence ? SongPart_BUILDUP_getInstance() : SongPart_BREAKDOWN_getInstance(), pos, now, dur);
      $this.rj_1 = 0;
    }
  } else if (dropHit) {
    $this.ji_1 = $this.ji_1 + 1 | 0;
    setPart($this, SongPart_DROP_getInstance(), pos, now, dur);
    var tmp_2 = $this;
    var tmp_3;
    if ($this.ji_1 === 1) {
      tmp_3 = DropKind_FIRST_getInstance();
    } else {
      var tmp_4;
      if (compare(dur, new Long(0, 0)) > 0) {
        var tmp_5 = toNumber(pos);
        // Inline function 'kotlin.Long.times' call
        tmp_4 = tmp_5 >= toNumber(dur) * 0.6;
      } else {
        tmp_4 = false;
      }
      if (tmp_4) {
        tmp_3 = DropKind_LAST_getInstance();
      } else {
        tmp_3 = DropKind_MIDDLE_getInstance();
      }
    }
    tmp_2.di_1 = tmp_3;
    $this.qj_1 = posNow;
    $this.rj_1 = 0;
  } else {
    switch ($this.ci_1.z_1) {
      case 0:
      case 5:
      case 2:
        if ($this.sj_1 >= 2) {
          setPart($this, SongPart_BUILDUP_getInstance(), pos, now, dur);
        }

        break;
      case 3:
        if ($this.tj_1 >= 8) {
          setPart($this, $this.ji_1 === 0 ? SongPart_INTRO_getInstance() : SongPart_BREAKDOWN_getInstance(), pos, now, dur);
        }

        break;
      default:
        break;
    }
  }
  if (compare(dur, new Long(0, 0)) > 0 && compare(pos, subtract(dur, new Long(20000, 0))) > 0 && $this.ji_1 > 0 && !$this.ci_1.equals(SongPart_DROP_getInstance())) {
    setPart($this, SongPart_OUTRO_getInstance(), pos, now, dur);
  }
  $this.vj_1 = $this.vj_1 + (0.35 + 0.95 * $this.gi_1 - $this.vj_1) * 0.25;
}
function runModel($this) {
  var tmp = 0;
  var tmp_0 = get_MODEL_BASE().length;
  var tmp_1 = new Float32Array(tmp_0);
  while (tmp < tmp_0) {
    var tmp_2 = tmp;
    tmp_1[tmp_2] = $this.ki_1[get_MODEL_BASE()[tmp_2]];
    tmp = tmp + 1 | 0;
  }
  var base = tmp_1;
  $this.pi_1.i(base);
  var x = new Float32Array(imul_0(base.length, 1 + get_MODEL_LAGS().length | 0));
  var inductionVariable = 0;
  var last = base.length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      x[i] = base[i];
    }
     while (inductionVariable <= last);
  var indexedObject = get_MODEL_LAGS();
  var inductionVariable_0 = 0;
  var last_0 = indexedObject.length;
  while (inductionVariable_0 < last_0) {
    var li = inductionVariable_0;
    var lag = indexedObject[inductionVariable_0];
    inductionVariable_0 = inductionVariable_0 + 1 | 0;
    // Inline function 'kotlin.math.max' call
    var a = ($this.pi_1.m() - 1 | 0) - lag | 0;
    var tmp$ret$1 = Math.max(a, 0);
    var past = $this.pi_1.n(tmp$ret$1);
    var inductionVariable_1 = 0;
    var last_1 = base.length - 1 | 0;
    if (inductionVariable_1 <= last_1)
      do {
        var i_0 = inductionVariable_1;
        inductionVariable_1 = inductionVariable_1 + 1 | 0;
        x[imul_0(base.length, li + 1 | 0) + i_0 | 0] = base[i_0] - past[i_0];
      }
       while (inductionVariable_1 <= last_1);
  }
  // Inline function 'kotlin.collections.copyInto' call
  var destination = $this.mi_1;
  var endIndex = x.length;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_3 = x;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp_3, destination, 0, 0, endIndex);
  $this.oi_1 = BuildUpModel_getInstance().b8(x);
  $this.qi_1.i($this.oi_1);
  // Inline function 'kotlin.math.max' call
  var b = $this.qi_1.m() - 4 | 0;
  var from = Math.max(0, b);
  var sum = 0.0;
  var inductionVariable_2 = from;
  var last_2 = $this.qi_1.m();
  if (inductionVariable_2 < last_2)
    do {
      var i_1 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      sum = sum + $this.qi_1.n(i_1);
    }
     while (inductionVariable_2 < last_2);
  $this.li_1 = sum / ($this.qi_1.m() - from | 0);
}
function setPart($this, p, pos, now, dur) {
  if (p.equals($this.ci_1))
    return Unit_instance;
  if ($this.ci_1.equals(SongPart_BUILDUP_getInstance()))
    $this.wj_1 = $this.uj_1;
  $this.ci_1 = p;
  $this.uj_1 = 0;
  if (!p.equals(SongPart_DROP_getInstance()))
    $this.di_1 = DropKind_NONE_getInstance();
  $this.ei_1 = p.y_1;
  $this.fi_1 = now;
}
function closeSlot$posS(p10, sRange, x) {
  return coerceIn_0((x - p10) / coerceAtLeast_1(sRange, 0.1), -0.5, 1.5);
}
function closeSlot$mean(l, from, to) {
  var s = 0.0;
  var inductionVariable = from;
  if (inductionVariable < to)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      s = s + l.n(i);
    }
     while (inductionVariable < to);
  return s / (to - from | 0);
}
function closeSlot$posA(aS, c, aRange, x) {
  return coerceIn_0((x - aS.n(numberToInt(c * 0.1))) / coerceAtLeast_1(aRange, 1.0), -0.5, 1.5);
}
function closeSlot$posP(pS, c, pRange, x) {
  return coerceIn_0((x - pS.n(numberToInt(c * 0.1))) / coerceAtLeast_1(pRange, 1.0), -0.5, 1.5);
}
function closeSlot$full(this$0, p10, sRange, aS, c, aRange, pS, pRange, from, to) {
  var tmp0 = closeSlot$posS(p10, sRange, closeSlot$mean(this$0.si_1, from, to));
  // Inline function 'kotlin.comparisons.minOf' call
  var b = (closeSlot$posA(aS, c, aRange, closeSlot$mean(this$0.ti_1, from, to)) + closeSlot$posP(pS, c, pRange, closeSlot$mean(this$0.ui_1, from, to))) / 2.0;
  return Math.min(tmp0, b);
}
function closeSlot$rank(c, l, x) {
  var k = 0;
  var _iterator__ex2g4s = l.j();
  while (_iterator__ex2g4s.k()) {
    var v = _iterator__ex2g4s.l();
    if (v < x) {
      k = k + 1 | 0;
    }
  }
  return k / c;
}
function SongListener() {
  this.ci_1 = SongPart_INTRO_getInstance();
  this.di_1 = DropKind_NONE_getInstance();
  this.ei_1 = '';
  this.fi_1 = new Long(0, 0);
  this.gi_1 = 0.0;
  this.hi_1 = 0.0;
  this.ii_1 = 0.0;
  this.ji_1 = 0;
  this.ki_1 = new Float32Array(get_LISTENER_FEATURES().m());
  this.li_1 = 0.0;
  this.mi_1 = new Float32Array(imul_0(get_MODEL_BASE().length, 1 + get_MODEL_LAGS().length | 0));
  this.ni_1 = 0.25;
  this.oi_1 = 0.0;
  this.pi_1 = ArrayList_init_$Create$();
  this.qi_1 = ArrayList_init_$Create$();
  this.ri_1 = new Float32Array(5);
  this.si_1 = ArrayList_init_$Create$();
  this.ti_1 = ArrayList_init_$Create$();
  this.ui_1 = ArrayList_init_$Create$();
  this.vi_1 = ArrayList_init_$Create$();
  this.wi_1 = ArrayList_init_$Create$();
  this.xi_1 = ArrayList_init_$Create$();
  this.yi_1 = ArrayList_init_$Create$();
  this.zi_1 = 0.0;
  this.aj_1 = 0.0;
  this.bj_1 = 0.0;
  this.cj_1 = 0.0;
  this.dj_1 = 0.0;
  this.ej_1 = 0;
  this.fj_1 = 0;
  this.gj_1 = 0;
  this.hj_1 = 0.0;
  this.ij_1 = 0.0;
  this.jj_1 = new Long(-1, -1);
  this.kj_1 = 400.0;
  this.lj_1 = new Float32Array(32);
  this.mj_1 = 0;
  this.nj_1 = 0;
  this.oj_1 = null;
  this.pj_1 = 0;
  this.qj_1 = 0.0;
  this.rj_1 = 0;
  this.sj_1 = 0;
  this.tj_1 = 0;
  this.uj_1 = 0;
  this.vj_1 = 0.4;
  this.wj_1 = 0;
  this.xj_1 = 0;
}
protoOf(SongListener).yj = function () {
  return this.kj_1;
};
protoOf(SongListener).zj = function () {
  return this.si_1.m();
};
protoOf(SongListener).hb = function (now) {
  this.vi_1.j2();
  this.wi_1.j2();
  this.si_1.j2();
  this.ti_1.j2();
  this.ui_1.j2();
  this.xi_1.j2();
  this.yi_1.j2();
  this.zi_1 = 0.0;
  this.aj_1 = 0.0;
  this.bj_1 = 0.0;
  this.cj_1 = 0.0;
  this.dj_1 = 0.0;
  this.ej_1 = 0;
  this.fj_1 = 0;
  this.gj_1 = 0;
  this.hj_1 = 0.0;
  this.ij_1 = 0.0;
  this.jj_1 = now;
  this.kj_1 = 400.0;
  this.mj_1 = 0;
  this.ci_1 = SongPart_INTRO_getInstance();
  this.di_1 = DropKind_NONE_getInstance();
  this.ei_1 = '';
  this.fi_1 = now;
  this.gi_1 = 0.0;
  this.hi_1 = 0.0;
  this.ii_1 = 0.0;
  this.ji_1 = 0;
  this.pi_1.j2();
  this.qi_1.j2();
  this.li_1 = 0.0;
  this.oi_1 = 0.0;
  this.oj_1 = null;
  this.pj_1 = 0;
  this.nj_1 = 0;
  this.qj_1 = 0.0;
  this.rj_1 = 0;
  this.sj_1 = 0;
  this.tj_1 = 0;
  this.uj_1 = 0;
  this.vj_1 = 0.4;
  this.wj_1 = 0;
  this.xj_1 = 0;
};
protoOf(SongListener).ye = function (f, now, positionMs, durationMs) {
  if (compare(this.jj_1, new Long(0, 0)) < 0) {
    this.hb(now);
  }
  if (!(f === this.oj_1)) {
    this.oj_1 = f;
    var containsArg = f.r8_1;
    if (100.0 <= containsArg ? containsArg <= 260.0 : false) {
      this.lj_1[this.mj_1 % this.lj_1.length | 0] = fold(this, f.r8_1);
      this.mj_1 = this.mj_1 + 1 | 0;
    }
    if (f.i8_1 > 0.7 && this.hj_1 <= 0.7) {
      this.fj_1 = this.fj_1 + 1 | 0;
    }
    if (f.s8_1 > 0.5 && this.ij_1 <= 0.5) {
      this.gj_1 = this.gj_1 + 1 | 0;
    }
    this.hj_1 = f.i8_1;
    this.ij_1 = f.s8_1;
    this.zi_1 = this.zi_1 + f.f9_1;
    var tmp = this;
    var tmp_0 = this.aj_1;
    // Inline function 'kotlin.math.max' call
    var a = f.g9_1;
    // Inline function 'kotlin.math.ln' call
    var x = Math.max(a, 250.0);
    tmp.aj_1 = tmp_0 + Math.log(x);
    this.bj_1 = this.bj_1 + f.z8_1;
    this.cj_1 = this.cj_1 + f.y8_1;
    this.dj_1 = this.dj_1 + f.a9_1;
    this.ej_1 = this.ej_1 + 1 | 0;
  }
  var gap = subtract(now, this.jj_1);
  if (compare(gap, new Long(4000, 0)) > 0) {
    this.jj_1 = now;
    resetSlot(this);
    this.pj_1 = this.si_1.m();
    this.nj_1 = 0;
    this.rj_1 = 0;
    this.sj_1 = 0;
    this.tj_1 = 0;
    return this.vj_1;
  }
  if (toNumber(gap) >= this.kj_1) {
    closeSlot(this, positionMs, durationMs, now);
    this.jj_1 = add(this.jj_1, coerceAtLeast_0(numberToLong(this.kj_1), new Long(1, 0)));
    resetSlot(this);
    this.kj_1 = nextSlotMs(this);
  }
  return this.vj_1;
};
var properties_initialized_SongListener_kt_arg4hh;
function _init_properties_SongListener_kt__8i8fex() {
  if (!properties_initialized_SongListener_kt_arg4hh) {
    properties_initialized_SongListener_kt_arg4hh = true;
    LISTENER_FEATURES = listOf_0(['posSub', 'posFull', 'posPre', 'jump', 'airRise', 'presRise', 'noiseRise', 'centRise', 'snareNow', 'snareRatio', 'kickNow', 'level', 'range', 'subDelta', 'airPos', 'presPos']);
    // Inline function 'kotlin.intArrayOf' call
    MODEL_BASE = new Int32Array([0, 1, 3, 4, 5, 6, 7, 9, 13, 14, 15, 11]);
    // Inline function 'kotlin.intArrayOf' call
    MODEL_LAGS = new Int32Array([2, 4, 8]);
  }
}
function volumeGain(volume) {
  // Inline function 'kotlin.math.pow' call
  var this_0 = coerceIn_0(volume, 0.0, 1.0);
  return 0.35 + 0.65 * Math.pow(this_0, 1.5);
}
function loudRamp(volume) {
  return coerceIn_0((volume - 0.7) / 0.3, 0.0, 1.0);
}
function loudness(volume) {
  return coerceIn_0((volume - 0.75) / 0.25, 0.0, 1.0);
}
function GenreLook(kick, spike, particles, shake, strobe, swayX, swayRot, bounceY, warmth) {
  kick = kick === VOID ? null : kick;
  spike = spike === VOID ? 1.0 : spike;
  particles = particles === VOID ? 1.0 : particles;
  shake = shake === VOID ? 1.0 : shake;
  strobe = strobe === VOID ? 1.0 : strobe;
  swayX = swayX === VOID ? 0.0 : swayX;
  swayRot = swayRot === VOID ? 0.0 : swayRot;
  bounceY = bounceY === VOID ? 0.0 : bounceY;
  warmth = warmth === VOID ? 0.0 : warmth;
  this.ak_1 = kick;
  this.bk_1 = spike;
  this.ck_1 = particles;
  this.dk_1 = shake;
  this.ek_1 = strobe;
  this.fk_1 = swayX;
  this.gk_1 = swayRot;
  this.hk_1 = bounceY;
  this.ik_1 = warmth;
}
protoOf(GenreLook).toString = function () {
  return 'GenreLook(kick=' + this.ak_1 + ', spike=' + this.bk_1 + ', particles=' + this.ck_1 + ', shake=' + this.dk_1 + ', strobe=' + this.ek_1 + ', swayX=' + this.fk_1 + ', swayRot=' + this.gk_1 + ', bounceY=' + this.hk_1 + ', warmth=' + this.ik_1 + ')';
};
protoOf(GenreLook).hashCode = function () {
  var result = this.ak_1 == null ? 0 : getNumberHashCode(this.ak_1);
  result = imul_0(result, 31) + getNumberHashCode(this.bk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ck_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.dk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ek_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.fk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.gk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.hk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ik_1) | 0;
  return result;
};
protoOf(GenreLook).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof GenreLook))
    return false;
  if (!equals(this.ak_1, other.ak_1))
    return false;
  if (!equals(this.bk_1, other.bk_1))
    return false;
  if (!equals(this.ck_1, other.ck_1))
    return false;
  if (!equals(this.dk_1, other.dk_1))
    return false;
  if (!equals(this.ek_1, other.ek_1))
    return false;
  if (!equals(this.fk_1, other.fk_1))
    return false;
  if (!equals(this.gk_1, other.gk_1))
    return false;
  if (!equals(this.hk_1, other.hk_1))
    return false;
  if (!equals(this.ik_1, other.ik_1))
    return false;
  return true;
};
function GenreRules() {
  this.jk_1 = 0.25;
}
protoOf(GenreRules).kk = function (f, now) {
  var p = f.d9_1;
  if (p <= 0.0 || compare(f.c9_1, new Long(0, 0)) <= 0 || toNumber(subtract(now, f.c9_1)) > p * 2.0)
    return null;
  // Inline function 'kotlin.Long.div' call
  var this_0 = subtract(now, f.c9_1);
  return (toNumber(this_0) / p % 1.0 + 1.0) % 1.0;
};
protoOf(GenreRules).lk = function (f, now) {
  var tmp0_safe_receiver = this.kk(f, now);
  var tmp;
  if (tmp0_safe_receiver == null) {
    tmp = null;
  } else {
    // Inline function 'kotlin.let' call
    tmp = ((f.b9_1 % 2 | 0) + tmp0_safe_receiver) / 2.0;
  }
  return tmp;
};
protoOf(GenreRules).mk = function (genre, edm, f, halfPulse, fullPulse, now) {
  var tmp;
  switch (genre.z_1) {
    case 1:
      var strong = coerceIn_0((f.h8_1 - 0.55) / 0.3, 0.0, 1.0) * coerceAtMost_0(0.5 + f.u8_1, 1.0);
      tmp = new GenreLook((halfPulse == null ? f.i8_1 : halfPulse) * strong, VOID, 1.0 + 0.6 * f.o8_1, VOID, 0.0);
      break;
    case 6:
      var ph = this.lk(f, now);
      var tmp_0;
      if (ph == null) {
        tmp_0 = 0.0;
      } else {
        // Inline function 'kotlin.math.sin' call
        var x = 2.0 * 3.141592653589793 * ph;
        tmp_0 = Math.sin(x) * (0.6 + 0.4 * coerceIn_0(f.h9_1, 0.0, 1.0));
      }

      var s = tmp_0;
      var tmp2_swayRot = 0.5 * s;
      tmp = new GenreLook(VOID, VOID, VOID, 0.0, 0.0, s, tmp2_swayRot, VOID, 1.0);
      break;
    case 7:
      var ph_0 = this.lk(f, now);
      var tmp4_bounceY = fullPulse == null ? f.i8_1 : fullPulse;
      var tmp_1;
      if (ph_0 == null) {
        tmp_1 = 0.0;
      } else {
        // Inline function 'kotlin.math.sin' call
        var x_0 = 2.0 * 3.141592653589793 * ph_0;
        tmp_1 = 0.6 * Math.sin(x_0);
      }

      var tmp5_swayX = tmp_1;
      tmp = new GenreLook(VOID, VOID, VOID, 0.0, 0.0, tmp5_swayX, VOID, tmp4_bounceY, 0.7);
      break;
    case 5:
      tmp = new GenreLook(VOID, VOID, VOID, 0.0, 0.0);
      break;
    case 3:
      tmp = edm == null ? new GenreLook() : new GenreLook(edm.qk_1 ? halfPulse : null, edm.tk_1, edm.rk_1, edm.sk_1, edm.uk_1);
      break;
    default:
      tmp = new GenreLook();
      break;
  }
  return tmp;
};
protoOf(GenreRules).vk = function (strength) {
  return 0.4 + 1.2 * coerceIn_0(strength, 0.0, 1.0);
};
var GenreRules_instance;
function GenreRules_getInstance() {
  return GenreRules_instance;
}
function get_SPEC() {
  _init_properties_Fmt_js_kt__oh89cm();
  return SPEC;
}
var SPEC;
function fmt(_this__u8e3s4, args) {
  _init_properties_Fmt_js_kt__oh89cm();
  var i = {_v: 0};
  var tmp = get_SPEC();
  return tmp.a5(_this__u8e3s4, fmt$lambda(args, i));
}
function fixed(v, digits) {
  _init_properties_Fmt_js_kt__oh89cm();
  // Inline function 'kotlin.math.pow' call
  var scale = Math.pow(10.0, digits);
  // Inline function 'kotlin.math.abs' call
  var tmp$ret$1 = Math.abs(v);
  var n = roundToLong(tmp$ret$1 * scale);
  var whole = divide(n, numberToLong(scale));
  var frac = padStart(modulo(n, numberToLong(scale)).toString(), digits, _Char___init__impl__6a9atx(48));
  var sign = v < 0 && !equalsLong(n, new Long(0, 0)) ? '-' : '';
  return digits === 0 ? sign + whole.toString() : sign + whole.toString() + '.' + frac;
}
function fmt$lambda($args, $i) {
  return function (m) {
    var plus = m.v5().n(1) === '+';
    var digits = toIntOrNull(m.v5().n(2));
    var tmp;
    switch (m.v5().n(3)) {
      case '%':
        tmp = '%';
        break;
      case 'f':
        var _unary__edvuaz = $i._v;
        $i._v = _unary__edvuaz + 1 | 0;
        var tmp_0 = getOrNull($args, _unary__edvuaz);
        var tmp1_safe_receiver = isNumber(tmp_0) ? tmp_0 : null;
        var tmp2_elvis_lhs = tmp1_safe_receiver == null ? null : numberToDouble(tmp1_safe_receiver);
        var v = tmp2_elvis_lhs == null ? 0.0 : tmp2_elvis_lhs;
        var text = fixed(v, digits == null ? 6 : digits);
        tmp = plus && v >= 0 ? '+' + text : text;
        break;
      case 'd':
        var _unary__edvuaz_0 = $i._v;
        $i._v = _unary__edvuaz_0 + 1 | 0;
        var tmp_1 = getOrNull($args, _unary__edvuaz_0);
        var tmp4_safe_receiver = isNumber(tmp_1) ? tmp_1 : null;
        var tmp5_elvis_lhs = tmp4_safe_receiver == null ? null : numberToLong(tmp4_safe_receiver);
        var v_0 = tmp5_elvis_lhs == null ? new Long(0, 0) : tmp5_elvis_lhs;
        tmp = plus && compare(v_0, new Long(0, 0)) >= 0 ? '+' + v_0.toString() : v_0.toString();
        break;
      default:
        var _unary__edvuaz_1 = $i._v;
        $i._v = _unary__edvuaz_1 + 1 | 0;
        tmp = toString_0(getOrNull($args, _unary__edvuaz_1));
        break;
    }
    return tmp;
  };
}
var properties_initialized_Fmt_js_kt_84k3ck;
function _init_properties_Fmt_js_kt__oh89cm() {
  if (!properties_initialized_Fmt_js_kt_84k3ck) {
    properties_initialized_Fmt_js_kt_84k3ck = true;
    SPEC = Regex_init_$Create$('%([+]?)(?:\\.(\\d+))?([dsbf%])');
  }
}
function raveCoreVersion() {
  return 1;
}
function _get_strength__jhduay($this) {
  var tmp0_elvis_lhs = $this.ml_1;
  return tmp0_elvis_lhs == null ? 0.5 : tmp0_elvis_lhs;
}
function tick$blend(mix, a, b) {
  return a + (b - a) * mix;
}
function tick$subMul(hsW, x) {
  return 1.0 + (x - 1.0) * hsW;
}
function WebPartyEngine(fftSize) {
  fftSize = fftSize === VOID ? 2048 : fftSize;
  this.wk_1 = new PcmFft(fftSize);
  this.xk_1 = new HardstyleAudio();
  this.yk_1 = new GenreDetector();
  this.zk_1 = new HardstyleStructure();
  this.al_1 = new SongListener();
  this.bl_1 = new HardSubDetector();
  this.cl_1 = new BeatClock();
  this.dl_1 = new BeatClock();
  this.el_1 = new FlashBudget();
  this.fl_1 = Random_0(7);
  this.gl_1 = new HardstyleFrame();
  this.hl_1 = new Long(0, 0);
  this.il_1 = new HardstyleFrame();
  this.jl_1 = new Float32Array(48);
  this.kl_1 = 0.0;
  this.ll_1 = 1.0;
  this.ml_1 = null;
  this.nl_1 = null;
  this.ol_1 = HardSub_RAW_getInstance();
  this.pl_1 = 0.0;
  this.ql_1 = SongPart_INTRO_getInstance();
  this.rl_1 = new Long(0, 0);
  this.sl_1 = false;
  this.tl_1 = new Long(-10000, -1);
  this.ul_1 = new Long(-10000, -1);
  this.vl_1 = 0;
  this.genre = 'HARDSTYLE';
  this.genreLabel = Genre_HARDSTYLE_getInstance().q9_1;
  this.genreAnnouncedAt = 0.0;
  this.partName = 'INTRO';
  this.partLabel = '';
  this.partLabelAt = 0.0;
  this.vibe = 1.0;
  this.vibeLive = 0.0;
  this.vibeAuto = true;
  this.rockness = 0.1;
  this.phaseLevel = 1.0;
  this.visualTime = 0.0;
  this.audioIntensity = 0.0;
  this.dropLook = 0;
  this.warmth = 0.0;
  this.dip = 0.0;
  this.dropHit = 0.0;
  this.breath = 0.0;
  this.grade = 0.0;
  this.shakeX = 0.0;
  this.shakeY = 0.0;
  this.shakeRotation = 0.0;
  this.bounceY = 0.0;
  this.aberration = 0.0;
  this.strobe = 0.0;
  this.strobeColor = 0;
  this.heavyFlash = 0.0;
  this.partyHit = 0.0;
  this.subGlow = 0.0;
  this.screechTint = 0.0;
  this.flashesPerSecond = 0;
  this.spike = 1.0;
  this.particles = 1.0;
  this.shakeAmount = 1.0;
  this.strobeAmount = 0.0;
  this.density = 1.0;
  this.softness = 1.0;
  this.hearing = false;
}
protoOf(WebPartyEngine).wl = function () {
  return this.wk_1.uh_1;
};
protoOf(WebPartyEngine).xl = function () {
  return this.genre;
};
protoOf(WebPartyEngine).yl = function () {
  return this.genreLabel;
};
protoOf(WebPartyEngine).zl = function () {
  return this.genreAnnouncedAt;
};
protoOf(WebPartyEngine).am = function () {
  return this.partName;
};
protoOf(WebPartyEngine).bm = function () {
  return this.partLabel;
};
protoOf(WebPartyEngine).cm = function () {
  return this.partLabelAt;
};
protoOf(WebPartyEngine).dm = function () {
  return this.vibe;
};
protoOf(WebPartyEngine).em = function () {
  return this.vibeLive;
};
protoOf(WebPartyEngine).fm = function () {
  return this.vibeAuto;
};
protoOf(WebPartyEngine).gm = function () {
  return this.rockness;
};
protoOf(WebPartyEngine).hm = function () {
  return this.phaseLevel;
};
protoOf(WebPartyEngine).im = function () {
  return this.visualTime;
};
protoOf(WebPartyEngine).jm = function () {
  return this.audioIntensity;
};
protoOf(WebPartyEngine).km = function () {
  return this.dropLook;
};
protoOf(WebPartyEngine).lm = function () {
  return this.warmth;
};
protoOf(WebPartyEngine).mm = function () {
  return this.dip;
};
protoOf(WebPartyEngine).nm = function () {
  return this.dropHit;
};
protoOf(WebPartyEngine).om = function () {
  return this.breath;
};
protoOf(WebPartyEngine).pm = function () {
  return this.grade;
};
protoOf(WebPartyEngine).qm = function () {
  return this.shakeX;
};
protoOf(WebPartyEngine).rm = function () {
  return this.shakeY;
};
protoOf(WebPartyEngine).sm = function () {
  return this.shakeRotation;
};
protoOf(WebPartyEngine).tm = function () {
  return this.bounceY;
};
protoOf(WebPartyEngine).um = function () {
  return this.aberration;
};
protoOf(WebPartyEngine).vm = function () {
  return this.strobe;
};
protoOf(WebPartyEngine).wm = function () {
  return this.strobeColor;
};
protoOf(WebPartyEngine).xm = function () {
  return this.heavyFlash;
};
protoOf(WebPartyEngine).ym = function () {
  return this.partyHit;
};
protoOf(WebPartyEngine).zm = function () {
  return this.subGlow;
};
protoOf(WebPartyEngine).an = function () {
  return this.screechTint;
};
protoOf(WebPartyEngine).bn = function () {
  return this.flashesPerSecond;
};
protoOf(WebPartyEngine).cn = function () {
  return this.spike;
};
protoOf(WebPartyEngine).dn = function () {
  return this.particles;
};
protoOf(WebPartyEngine).en = function () {
  return this.shakeAmount;
};
protoOf(WebPartyEngine).fn = function () {
  return this.strobeAmount;
};
protoOf(WebPartyEngine).gn = function () {
  return this.density;
};
protoOf(WebPartyEngine).hn = function () {
  return this.softness;
};
protoOf(WebPartyEngine).in = function () {
  return this.hearing;
};
protoOf(WebPartyEngine).jn = function () {
  return this.al_1.ci_1.y_1;
};
protoOf(WebPartyEngine).kn = function () {
  return this.al_1.gi_1;
};
protoOf(WebPartyEngine).ln = function () {
  return this.al_1.hi_1;
};
protoOf(WebPartyEngine).mn = function () {
  return this.al_1.ii_1;
};
protoOf(WebPartyEngine).nn = function () {
  return this.al_1.li_1;
};
protoOf(WebPartyEngine).on = function () {
  return this.al_1.oi_1;
};
protoOf(WebPartyEngine).pn = function () {
  return this.al_1.ji_1;
};
protoOf(WebPartyEngine).qn = function () {
  return this.al_1.zj();
};
protoOf(WebPartyEngine).yj = function () {
  return this.al_1.yj();
};
protoOf(WebPartyEngine).rn = function () {
  return this.al_1.ni_1;
};
protoOf(WebPartyEngine).sn = function () {
  return this.al_1.ki_1;
};
protoOf(WebPartyEngine).tn = function () {
  return this.al_1.ri_1;
};
protoOf(WebPartyEngine).un = function () {
  // Inline function 'kotlin.collections.toTypedArray' call
  var this_0 = get_LISTENER_FEATURES();
  return copyToArray(this_0);
};
protoOf(WebPartyEngine).vn = function () {
  return this.al_1.mi_1;
};
protoOf(WebPartyEngine).wn = function () {
  var tmp = 0;
  var tmp_0 = BuildUpModel_getInstance().m();
  var tmp_1 = new Float32Array(tmp_0);
  while (tmp < tmp_0) {
    var tmp_2 = tmp;
    tmp_1[tmp_2] = BuildUpModel_getInstance().z7(this.al_1.mi_1, tmp_2);
    tmp = tmp + 1 | 0;
  }
  return tmp_1;
};
protoOf(WebPartyEngine).xn = function () {
  return BuildUpModel_getInstance().a8();
};
protoOf(WebPartyEngine).yn = function () {
  // Inline function 'kotlin.collections.toTypedArray' call
  var this_0 = BuildUpModel_getInstance().u7_1;
  return copyToArray(this_0);
};
protoOf(WebPartyEngine).zn = function () {
  return this.zk_1.pc_1.wb_1;
};
protoOf(WebPartyEngine).ao = function () {
  return this.zk_1.pc_1.rb_1;
};
protoOf(WebPartyEngine).bo = function () {
  return this.zk_1.pc_1.tb_1;
};
protoOf(WebPartyEngine).co = function () {
  return this.il_1.h8_1;
};
protoOf(WebPartyEngine).do = function () {
  return this.il_1.i8_1;
};
protoOf(WebPartyEngine).eo = function () {
  return this.il_1.j8_1;
};
protoOf(WebPartyEngine).fo = function () {
  return this.il_1.k8_1;
};
protoOf(WebPartyEngine).go = function () {
  return this.il_1.l8_1;
};
protoOf(WebPartyEngine).ho = function () {
  return this.il_1.m8_1;
};
protoOf(WebPartyEngine).io = function () {
  return this.il_1.o8_1;
};
protoOf(WebPartyEngine).jo = function () {
  return this.il_1.p8_1;
};
protoOf(WebPartyEngine).ko = function () {
  return this.il_1.q8_1;
};
protoOf(WebPartyEngine).lo = function () {
  return this.il_1.s8_1;
};
protoOf(WebPartyEngine).mo = function () {
  return this.il_1.t8_1;
};
protoOf(WebPartyEngine).no = function () {
  return this.il_1.u8_1;
};
protoOf(WebPartyEngine).oo = function () {
  return this.il_1.w8_1;
};
protoOf(WebPartyEngine).po = function () {
  return this.il_1.i9_1;
};
protoOf(WebPartyEngine).qo = function () {
  return this.il_1.j9_1;
};
protoOf(WebPartyEngine).ro = function () {
  return this.il_1.r8_1;
};
protoOf(WebPartyEngine).so = function () {
  return this.jl_1;
};
protoOf(WebPartyEngine).pushPcm = function (samples, rateHz, nowMs) {
  var now = numberToLong(nowMs);
  var fft = this.wk_1.bi(samples, rateHz);
  this.gl_1 = this.xk_1.ph(fft, rateHz, now);
  this.hl_1 = now;
  return fft;
};
protoOf(WebPartyEngine).newTrack = function (nowMs) {
  var now = numberToLong(nowMs);
  this.xk_1.f8();
  this.gl_1 = new HardstyleFrame();
  this.yk_1.hb(now);
  this.zk_1.hb(now);
  this.al_1.hb(now);
  this.bl_1.vf();
  this.pl_1 = 0.0;
  this.cl_1.f8();
  this.dl_1.f8();
  this.dip = 0.0;
  this.dropHit = 0.0;
  this.ql_1 = SongPart_INTRO_getInstance();
  this.dropLook = 0;
  this.rl_1 = new Long(0, 0);
  this.sl_1 = false;
};
protoOf(WebPartyEngine).setMetadata = function (appleGenre, appleExact, deezerGenres, nowMs) {
  this.yk_1.ib(appleGenre, appleExact, toList_0(deezerGenres), null, numberToLong(nowMs));
  this.genre = this.yk_1.y9_1.y_1;
};
protoOf(WebPartyEngine).setStrength = function (value) {
  var tmp = this;
  tmp.ml_1 = value == null ? null : coerceIn_0(value, 0.0, 1.0);
};
protoOf(WebPartyEngine).tick = function (nowMs, dtS, playing, positionMs, durationMs, volume) {
  var now = numberToLong(nowMs);
  var dt = coerceIn_0(dtS, 0.0, 0.05);
  var fresh = compare(subtract(now, this.hl_1), new Long(300, 0)) < 0;
  this.hearing = fresh;
  var rawTarget = playing && fresh ? this.gl_1 : new HardstyleFrame();
  var pos = numberToLong(positionMs);
  var dur = durationMs > 0 ? numberToLong(durationMs) : new Long(-1, -1);
  var tmp0_elvis_lhs = maxOrNull_0(rawTarget.n8_1);
  var activity = maxOf(rawTarget.h8_1, new Float32Array([rawTarget.i8_1, rawTarget.j8_1, rawTarget.o8_1, tmp0_elvis_lhs == null ? 0.0 : tmp0_elvis_lhs]));
  if (playing && activity > 0.025)
    this.visualTime = this.visualTime + dt * (0.35 + activity);
  this.audioIntensity = playing && activity > 0.025 ? coerceIn_0(activity, 0.0, 1.0) : 0.0;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / (playing ? 0.025 : 0.12);
  var mix = 1.0 - Math.exp(x);
  var g = playing && fresh ? this.yk_1.jb(rawTarget, now) : this.yk_1.y9_1;
  this.genre = g.y_1;
  this.genreAnnouncedAt = toNumber(this.yk_1.ba_1);
  var tmp = this;
  // Inline function 'kotlin.math.round' call
  var x_0 = this.yk_1.db_1 * 100.0;
  tmp.rockness = round(x_0) / 100.0;
  this.vibeAuto = this.ml_1 == null;
  var vibeGoal = this.yk_1.gb() ? 1.0 : vibeTarget(g);
  var tmp_0 = this.vibe;
  var tmp_1 = vibeGoal - this.vibe;
  // Inline function 'kotlin.math.exp' call
  var x_1 = -dt / 0.6;
  var glided = tmp_0 + tmp_1 * (1.0 - Math.exp(x_1));
  var tmp_2 = this;
  var tmp_3;
  // Inline function 'kotlin.math.abs' call
  var x_2 = vibeGoal - glided;
  if (Math.abs(x_2) < 0.002) {
    tmp_3 = vibeGoal;
  } else {
    tmp_3 = glided;
  }
  tmp_2.vibe = tmp_3;
  var v = this.vibe;
  var r = this.rockness;
  var hardW = hardWeight(v);
  if (!playing || !fresh) {
    this.cl_1.f8();
    this.dl_1.f8();
  }
  var clockOn = v >= 0.4;
  var clockPulse = playing && fresh ? this.cl_1.k9(rawTarget, now, 70.0) : null;
  var clockKick = clockOn ? clockPulse : null;
  var halfPulse = playing && fresh ? this.dl_1.g8(rawTarget, now, 70.0, true, 350.0) : null;
  var look = GenreRules_instance.mk(g, this.nl_1, rawTarget, halfPulse, clockPulse, now);
  var strengthMul = GenreRules_instance.vk(_get_strength__jhduay(this));
  var clocked = !(clockKick == null) ? rawTarget.x9(VOID, clockKick) : rawTarget;
  var visualInput = this.zk_1.lc_1.equals(SongPart_BUILDUP_getInstance()) ? clocked.x9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, clocked.s8_1 * 0.3) : clocked;
  var shapedFull = vibeShape(visualInput, v, r);
  var phaseIntensity = playing && fresh ? this.zk_1.ye(rawTarget, now, pos, dur) : 1.0;
  if (playing && fresh) {
    this.al_1.ye(rawTarget, now, pos, dur);
  }
  this.partName = this.zk_1.lc_1.y_1;
  this.partLabel = this.zk_1.nc_1;
  this.partLabelAt = toNumber(this.zk_1.oc_1);
  if (playing && fresh && hardW > 0.0)
    this.ol_1 = this.bl_1.jb(rawTarget, now);
  var tmp_4 = this;
  var tmp_5;
  switch (g.z_1) {
    case 0:
      tmp_5 = this.rockness >= 0.5 ? 'ROCK' : 'HARDSTYLE \xB7 ' + this.ol_1.bf_1;
      break;
    case 3:
      var tmp2_safe_receiver = this.nl_1;
      var tmp_6;
      if (tmp2_safe_receiver == null) {
        tmp_6 = null;
      } else {
        // Inline function 'kotlin.let' call
        tmp_6 = 'EDM \xB7 ' + tmp2_safe_receiver.pk_1;
      }

      var tmp3_elvis_lhs = tmp_6;
      tmp_5 = tmp3_elvis_lhs == null ? 'EDM' : tmp3_elvis_lhs;
      break;
    default:
      tmp_5 = g.q9_1;
      break;
  }
  tmp_4.genreLabel = tmp_5;
  var sw = structureWeight(v) * (1.0 - hardW * r);
  var heldOnPurpose = this.zk_1.lc_1.equals(SongPart_DROP_getInstance()) || this.zk_1.lc_1.equals(SongPart_BUILDUP_getInstance()) || this.zk_1.lc_1.equals(SongPart_BREAKDOWN_getInstance()) || this.zk_1.lc_1.equals(SongPart_ANTI_CLIMAX_getInstance());
  if (!playing || heldOnPurpose || rawTarget.k8_1 < 0.3)
    this.pl_1 = 0.0;
  else if (rawTarget.k8_1 > 0.55)
    this.pl_1 = this.pl_1 + dt;
  var missedDrop = coerceIn_0((this.pl_1 - 20.0) / 10.0, 0.0, 1.0);
  var remainingMs = compare(dur, new Long(0, 0)) > 0 ? subtract(dur, pos) : new Long(-1, -1);
  var outroFade = (compare(new Long(0, 0), remainingMs) <= 0 ? compare(remainingMs, new Long(20000, 0)) < 0 : false) ? 0.3 + (1.0 - 0.3) * (toNumber(remainingMs) / toNumber(new Long(20000, 0))) : 1.0;
  var tmp0 = 1.0 + (phaseIntensity - 1.0) * sw;
  // Inline function 'kotlin.math.max' call
  var b = 0.9 * missedDrop;
  var pi = Math.max(tmp0, b) * outroFade;
  var inDrop = sw > 0.0 && this.zk_1.lc_1.equals(SongPart_DROP_getInstance());
  var effectsOn = sw <= 0.5 || this.zk_1.we() || missedDrop >= 1.0;
  var hsW = hardW * (1.0 - r);
  var sub = this.ol_1;
  this.phaseLevel = coerceAtMost_0(pi, 1.0);
  var live = !playing ? 0.0 : coerceIn_0(sw * coerceAtMost_0(pi, 1.0) + (1.0 - sw) * coerceIn_0(rawTarget.k8_1, 0.0, 1.0), 0.0, 1.0);
  var liveGoal = coerceIn_0(_get_strength__jhduay(this) * (0.35 + 0.65 * live), 0.0, 1.0);
  var tmp_7 = this;
  var tmp_8 = this.vibeLive;
  var tmp_9 = liveGoal - this.vibeLive;
  // Inline function 'kotlin.math.exp' call
  var x_3 = -dt / 0.35;
  // Inline function 'kotlin.math.round' call
  var x_4 = (tmp_8 + tmp_9 * (1.0 - Math.exp(x_3))) * 200.0;
  tmp_7.vibeLive = round(x_4) / 200.0;
  var screechShake = hsW * (this.zk_1.lc_1.equals(SongPart_DROP_getInstance()) && effectsOn ? sub.gf_1 * (this.zk_1.mc_1.equals(DropKind_LAST_getInstance()) ? 1.3 : 1.0) : this.zk_1.lc_1.equals(SongPart_DROP_getInstance()) ? 0.5 * sub.gf_1 : 0.0);
  var tmp_10;
  if (sw <= 0.0) {
    tmp_10 = shapedFull;
  } else if (inDrop) {
    var tmp0_0 = shapedFull.p8_1 * pi;
    // Inline function 'kotlin.math.max' call
    var b_0 = effectsOn ? 0.35 * sw * coerceAtMost_0(pi, 1.0) : 0.0;
    var tmp$ret$9 = Math.max(tmp0_0, b_0);
    tmp_10 = shapedFull.x9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, coerceAtMost_0(tmp$ret$9, 1.0), effectsOn ? shapedFull.q8_1 : 0.0);
  } else {
    var tmp4_heavy = coerceAtMost_0(shapedFull.p8_1 * pi, 1.0);
    var tmp5_kick = shapedFull.i8_1 * (0.6 + 0.4 * coerceAtMost_0(pi, 1.0));
    var tmp6_grit = missedDrop >= 1.0 ? shapedFull.q8_1 : shapedFull.q8_1 * (1.0 - sw);
    tmp_10 = shapedFull.x9(VOID, tmp5_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp4_heavy, tmp6_grit);
  }
  var shaped = tmp_10;
  var showW = structureWeight(v) * (1.0 - 0.7 * r * hardW);
  var hud = this.zk_1.pc_1;
  var part = this.zk_1.lc_1;
  var buildRise = part.equals(SongPart_BUILDUP_getInstance()) ? coerceIn_0(hud.wb_1, 0.0, 1.0) * showW : 0.0;
  var hadDip = this.dip > 0.3 || compare(this.rl_1, new Long(0, 0)) > 0 || this.sl_1;
  if (!part.equals(SongPart_BUILDUP_getInstance())) {
    this.rl_1 = new Long(0, 0);
    this.sl_1 = false;
  }
  var tmp_11;
  if (part.equals(SongPart_BUILDUP_getInstance()) && hud.tb_1 && !this.sl_1) {
    var tmp0_1 = this.zk_1.xe() >= 1 && hud.rb_1 === 8 ? 1.0 : 0.0;
    // Inline function 'kotlin.comparisons.maxOf' call
    var b_1 = coerceIn_0((hud.wb_1 - 0.75) / (1.0 - 0.75), 0.0, 1.0);
    tmp_11 = showW * Math.max(tmp0_1, b_1);
  } else {
    tmp_11 = 0.0;
  }
  var dipWanted = tmp_11;
  if (dipWanted > 0.3 && equalsLong(this.rl_1, new Long(0, 0)))
    this.rl_1 = now;
  if (compare(this.rl_1, new Long(0, 0)) > 0 && compare(subtract(now, this.rl_1), new Long(2500, 0)) > 0)
    this.sl_1 = true;
  var dipGoal = this.sl_1 ? 0.0 : dipWanted;
  var tmp_12;
  if (part.equals(SongPart_DROP_getInstance())) {
    tmp_12 = 0.0;
  } else {
    var tmp_13 = this.dip;
    var tmp_14 = dipGoal - this.dip;
    // Inline function 'kotlin.math.exp' call
    var x_5 = -dt / (dipGoal > this.dip ? 0.3 : 0.5);
    tmp_12 = tmp_13 + tmp_14 * (1.0 - Math.exp(x_5));
  }
  var dipNext = tmp_12;
  var tmp_15 = this;
  // Inline function 'kotlin.math.round' call
  var x_6 = dipNext * 100.0;
  tmp_15.dip = round(x_6) / 100.0;
  if (part.equals(SongPart_DROP_getInstance()) && !this.ql_1.equals(SongPart_DROP_getInstance()) && showW > 0.3 && this.el_1.m9(now))
    this.dropHit = hadDip ? 1.0 : 0.5;
  else if (this.dropHit > 0.0) {
    var tmp_16 = this;
    var tmp_17 = this.dropHit;
    // Inline function 'kotlin.math.exp' call
    var x_7 = -dt / 0.2;
    // Inline function 'kotlin.let' call
    var it = tmp_17 * Math.exp(x_7);
    tmp_16.dropHit = it < 0.01 ? 0.0 : it;
  }
  this.ql_1 = part;
  var inShowDrop = part.equals(SongPart_DROP_getInstance()) && showW > 0.0;
  this.dropLook = inShowDrop ? (hud.sb_1 + this.zk_1.xe() | 0) % 3 | 0 : 0;
  var tmp_18;
  if (!inShowDrop) {
    tmp_18 = 1.0;
  } else {
    tmp_18 = this.dropLook === 1 ? 1.2 : 0.95;
  }
  var lookSpike = tmp_18;
  var tmp_19;
  if (!inShowDrop) {
    tmp_19 = 1.0;
  } else {
    switch (this.dropLook) {
      case 0:
        tmp_19 = 1.15;
        break;
      case 1:
        tmp_19 = 0.75;
        break;
      default:
        tmp_19 = 0.9;
        break;
    }
  }
  var lookShake = tmp_19;
  var lookParticles = inShowDrop && this.dropLook === 1 ? 1.1 : 1.0;
  this.flashesPerSecond = this.el_1.n9(now);
  var tune = 1.0;
  var p = vibeProfile(v, r);
  this.spike = p.r9_1 * (0.75 + 0.25 * pi) * tick$subMul(hsW, sub.ef_1) * lookSpike * tune * look.bk_1 * strengthMul;
  this.particles = p.s9_1 * (0.6 + 0.4 * pi) * tick$subMul(hsW, sub.ff_1) * (1.0 + 0.25 * buildRise) * lookParticles * tune * look.ck_1 * strengthMul;
  this.shakeAmount = p.t9_1 * pi * tick$subMul(hsW, sub.cf_1) * lookShake * tune * look.dk_1 * strengthMul;
  this.strobeAmount = p.u9_1 * (effectsOn && pi >= 0.9 ? 1.0 : 0.0) * tick$subMul(hsW, sub.df_1) * look.ek_1 * (_get_strength__jhduay(this) < 0.25 ? 0.0 : 1.0);
  this.density = p.v9_1 * (1.0 + 0.2 * buildRise);
  var tmp_20 = this;
  // Inline function 'kotlin.let' call
  var it_0 = p.w9_1;
  tmp_20.softness = it_0 <= 1.2 ? coerceAtMost_0(it_0, 1.15) : it_0;
  var popLift = g.equals(Genre_POP_getInstance()) || g.equals(Genre_REGGAE_getInstance()) || g.equals(Genre_REGGAETON_getInstance()) ? this.yk_1.ha_1 : 0.0;
  if (popLift > 0.0) {
    this.spike = this.spike * (1.0 + 0.35 * popLift);
    this.particles = this.particles * (1.0 + 0.4 * popLift);
  }
  var tmp_21;
  if (popLift > 0.0) {
    var tmp9_kick = coerceAtMost_0(shaped.i8_1 * (1.0 + 0.6 * popLift), 1.0);
    var tmp10_bass = coerceAtMost_0(shaped.h8_1 * (1.0 + 0.15 * popLift), 1.0);
    tmp_21 = shaped.x9(tmp10_bass, tmp9_kick);
  } else {
    tmp_21 = shaped;
  }
  var shapedPop = tmp_21;
  var tmp_22;
  if (buildRise > 0.0) {
    var tmp0_2 = shapedPop.i8_1;
    // Inline function 'kotlin.math.max' call
    var b_2 = rawTarget.s8_1 * 0.45 * buildRise;
    var tmp$ret$18 = Math.max(tmp0_2, b_2);
    tmp_22 = shapedPop.x9(VOID, tmp$ret$18);
  } else {
    tmp_22 = shapedPop;
  }
  var untuned = tmp_22;
  var tmp11_safe_receiver = look.ak_1;
  var tmp_23;
  if (tmp11_safe_receiver == null) {
    tmp_23 = null;
  } else {
    // Inline function 'kotlin.let' call
    tmp_23 = untuned.x9(VOID, coerceIn_0(tmp11_safe_receiver, 0.0, 1.0));
  }
  var tmp12_elvis_lhs = tmp_23;
  var target = tmp12_elvis_lhs == null ? untuned : tmp12_elvis_lhs;
  var liveSpectrum = playing && fresh;
  var inductionVariable = 0;
  if (inductionVariable < 48)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var goal = liveSpectrum ? target.n8_1.n(i) : 0.0;
      var current = this.jl_1[i];
      var tau = goal > current ? 0.022 : 0.13;
      var tmp_24 = goal - current;
      // Inline function 'kotlin.math.exp' call
      var x_8 = -dt / tau;
      var value = current + tmp_24 * (1.0 - Math.exp(x_8));
      if (value < 1.0E-4)
        value = 0.0;
      this.jl_1[i] = value;
    }
     while (inductionVariable < 48);
  this.il_1 = new HardstyleFrame(tick$blend(mix, this.il_1.h8_1, target.h8_1), clockOn ? target.i8_1 : tick$blend(mix, this.il_1.i8_1, target.i8_1), tick$blend(mix, this.il_1.j8_1, target.j8_1), tick$blend(mix, this.il_1.k8_1, target.k8_1), clockOn ? target.l8_1 : tick$blend(mix, this.il_1.l8_1, target.l8_1), tick$blend(mix, this.il_1.m8_1, target.m8_1), toList(this.jl_1), tick$blend(mix, this.il_1.o8_1, playing && fresh ? target.o8_1 : 0.0), tick$blend(mix, this.il_1.p8_1, target.p8_1), tick$blend(mix, this.il_1.q8_1, target.q8_1), target.r8_1, target.s8_1, target.t8_1, target.u8_1, target.v8_1, tick$blend(mix, this.il_1.w8_1, target.w8_1), target.x8_1, target.y8_1, target.z8_1, target.a9_1, target.b9_1, VOID, VOID, VOID, VOID, VOID, VOID, tick$blend(mix, this.il_1.i9_1, target.i9_1), target.j9_1);
  var f = this.il_1;
  var ramp = loudRamp(volume);
  var punch = this.shakeAmount * f.i8_1 * volumeGain(volume) * (f.p8_1 * (10.0 + loudness(volume) * 4.0) * (1.0 + ramp * 0.8) + ramp * 5.0);
  var tremble = screechShake * f.w8_1 * 7.0 * volumeGain(volume);
  if (f.i8_1 < 0.3)
    this.ll_1 = 1.0;
  if (f.i8_1 > 0.55 && this.ll_1 === 1.0) {
    this.ll_1 = 0.0;
    this.kl_1 = this.fl_1.t6() * 2 * 3.141592653589793;
  }
  // Inline function 'kotlin.Long.div' call
  var this_0 = modulo(now, new Long(1000000, 0));
  var s = toNumber(this_0) / 1000.0;
  var wobble = punch * 0.35 + tremble;
  // Inline function 'kotlin.math.cos' call
  var x_9 = this.kl_1;
  var tmp_25 = Math.cos(x_9) * punch;
  // Inline function 'kotlin.math.sin' call
  var x_10 = s * 61.0;
  var x_11 = tmp_25 + Math.sin(x_10) * wobble;
  // Inline function 'kotlin.math.sin' call
  var x_12 = this.kl_1;
  var tmp_26 = Math.sin(x_12) * punch;
  // Inline function 'kotlin.math.cos' call
  var x_13 = s * 47.0;
  var y = tmp_26 + Math.cos(x_13) * wobble;
  var big = punch + tremble > 0.2;
  this.shakeX = big ? x_11 : 0.0;
  this.shakeY = big ? y : 0.0;
  this.shakeRotation = big ? f.p8_1 * f.i8_1 * 0.8 * (this.kl_1 > 3.141592653589793 ? -1.0 : 1.0) : 0.0;
  var split = f.p8_1 * f.i8_1 * this.shakeAmount;
  this.aberration = effectsOn && split > 0.25 ? coerceAtMost_0((split - 0.25) / 0.75, 1.0) * 5.0 : 0.0;
  this.bounceY = -look.hk_1 * 10.0 * strengthMul;
  this.warmth = look.ik_1;
  var lowBands = 0.0;
  var inductionVariable_0 = 0;
  if (inductionVariable_0 < 24)
    do {
      var i_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      lowBands = lowBands + this.jl_1[i_0];
    }
     while (inductionVariable_0 < 24);
  lowBands = lowBands / 24;
  var tmp_27 = 1.2 * lowBands;
  // Inline function 'kotlin.math.pow' call
  var this_1 = lowBands;
  var tmp$ret$27 = Math.pow(this_1, 1.2);
  // Inline function 'kotlin.math.pow' call
  var this_2 = coerceIn_0(5.0 * (tmp_27 - tmp$ret$27), 0.0, 1.0);
  var knee = Math.pow(this_2, 0.8);
  var tmp_28 = this;
  var tmp_29 = this.breath;
  var tmp_30 = knee - this.breath;
  // Inline function 'kotlin.math.exp' call
  var x_14 = -dt / (knee > this.breath ? 0.08 : 0.35);
  tmp_28.breath = tmp_29 + tmp_30 * (1.0 - Math.exp(x_14));
  var tmp_31;
  if (sw > 0.5) {
    var tmp_32;
    switch (this.zk_1.lc_1.z_1) {
      case 0:
      case 2:
      case 6:
      case 7:
        tmp_32 = -0.6;
        break;
      case 1:
      case 5:
        tmp_32 = 0.0;
        break;
      case 3:
        tmp_32 = 0.35;
        break;
      case 4:
        tmp_32 = 1.0;
        break;
      default:
        noWhenBranchMatchedException();
        break;
    }
    tmp_31 = tmp_32;
  } else {
    tmp_31 = coerceIn_0(-0.4 + this.il_1.k8_1 * 1.2, -0.6, 0.8);
  }
  var gradeTarget = tmp_31;
  var tmp_33 = this;
  var tmp_34 = this.grade;
  var tmp_35 = (playing ? gradeTarget : 0.0) - this.grade;
  // Inline function 'kotlin.math.exp' call
  var x_15 = -dt / 1.5;
  tmp_33.grade = tmp_34 + tmp_35 * (1.0 - Math.exp(x_15));
  var tmp_36 = this;
  var tmp_37 = 0.3 + 0.7 * this.phaseLevel;
  var tmp0_3 = f.i8_1;
  var tmp2 = f.h8_1 * 0.55;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = f.o8_1 * 0.2;
  var tmp_38 = Math.max(tmp0_3, tmp2, c) + f.p8_1 * f.i8_1 * 0.4;
  var tmp14_elvis_lhs = maxOrNull(this.jl_1);
  tmp_36.partyHit = coerceAtMost_0(tmp_37 * (tmp_38 + (tmp14_elvis_lhs == null ? 0.0 : tmp14_elvis_lhs) * 0.25 * volumeGain(volume)), 1.6);
  var heavyRaw = f.p8_1 * f.i8_1 * (0.6 + 0.4 * loudness(volume));
  var showOn = structureWeight(v);
  this.subGlow = 0.12 * f.u8_1 * f.h8_1 * showOn;
  this.screechTint = coerceAtMost_0(f.w8_1 * 0.7 * showOn, 0.7);
  var tmp0_4 = f.i8_1 * f.p8_1;
  // Inline function 'kotlin.math.max' call
  var b_3 = f.t8_1 * hardWeight(v);
  var strobeSource = Math.max(tmp0_4, b_3);
  var strobeFrom = 0.85 - 0.15 * hardWeight(v);
  var strobeRaw = this.strobeAmount * strobeSource * coerceIn_0((volume - strobeFrom) / 0.15, 0.0, 1.0);
  if (strobeRaw > 0.3 && compare(subtract(now, this.tl_1), new Long(400, 0)) >= 0 && this.el_1.m9(now)) {
    this.tl_1 = now;
    this.vl_1 = this.vl_1 + 1 | 0;
  }
  this.strobe = compare(subtract(now, this.tl_1), new Long(120, 0)) < 0 ? strobeRaw : 0.0;
  this.strobeColor = this.vl_1;
  if (heavyRaw > 0.3 && compare(subtract(now, this.ul_1), new Long(400, 0)) >= 0 && compare(subtract(now, this.tl_1), new Long(120, 0)) >= 0 && this.el_1.m9(now))
    this.ul_1 = now;
  this.heavyFlash = heavyRaw > 0.02 && compare(subtract(now, this.ul_1), new Long(120, 0)) < 0 ? heavyRaw : 0.0;
};
//region block: post-declaration
protoOf(InternalHashMap).e3 = containsAllEntries;
defineProp(protoOf(WebPartyEngine), 'hop', protoOf(WebPartyEngine).wl);
defineProp(protoOf(WebPartyEngine), 'listenerPart', protoOf(WebPartyEngine).jn);
defineProp(protoOf(WebPartyEngine), 'listenerLevel', protoOf(WebPartyEngine).kn);
defineProp(protoOf(WebPartyEngine), 'pBuild', protoOf(WebPartyEngine).ln);
defineProp(protoOf(WebPartyEngine), 'pDrop', protoOf(WebPartyEngine).mn);
defineProp(protoOf(WebPartyEngine), 'pBuildModel', protoOf(WebPartyEngine).nn);
defineProp(protoOf(WebPartyEngine), 'pBuildModelRaw', protoOf(WebPartyEngine).on);
defineProp(protoOf(WebPartyEngine), 'listenerDrops', protoOf(WebPartyEngine).pn);
defineProp(protoOf(WebPartyEngine), 'listenerSlots', protoOf(WebPartyEngine).qn);
defineProp(protoOf(WebPartyEngine), 'slotLengthMs', protoOf(WebPartyEngine).yj);
defineProp(protoOf(WebPartyEngine), 'jumpNeeded', protoOf(WebPartyEngine).rn);
defineProp(protoOf(WebPartyEngine), 'listenerFeatures', protoOf(WebPartyEngine).sn);
defineProp(protoOf(WebPartyEngine), 'listenerLevels', protoOf(WebPartyEngine).tn);
defineProp(protoOf(WebPartyEngine), 'featureNames', protoOf(WebPartyEngine).un);
defineProp(protoOf(WebPartyEngine), 'modelInput', protoOf(WebPartyEngine).vn);
defineProp(protoOf(WebPartyEngine), 'modelContrib', protoOf(WebPartyEngine).wn);
defineProp(protoOf(WebPartyEngine), 'modelBias', protoOf(WebPartyEngine).xn);
defineProp(protoOf(WebPartyEngine), 'modelFeatureNames', protoOf(WebPartyEngine).yn);
defineProp(protoOf(WebPartyEngine), 'hudBuild', protoOf(WebPartyEngine).zn);
defineProp(protoOf(WebPartyEngine), 'hudBar', protoOf(WebPartyEngine).ao);
defineProp(protoOf(WebPartyEngine), 'hudReady', protoOf(WebPartyEngine).bo);
defineProp(protoOf(WebPartyEngine), 'bass', protoOf(WebPartyEngine).co);
defineProp(protoOf(WebPartyEngine), 'kick', protoOf(WebPartyEngine).do);
defineProp(protoOf(WebPartyEngine), 'highs', protoOf(WebPartyEngine).eo);
defineProp(protoOf(WebPartyEngine), 'energy', protoOf(WebPartyEngine).fo);
defineProp(protoOf(WebPartyEngine), 'burst', protoOf(WebPartyEngine).go);
defineProp(protoOf(WebPartyEngine), 'build', protoOf(WebPartyEngine).ho);
defineProp(protoOf(WebPartyEngine), 'highMotion', protoOf(WebPartyEngine).io);
defineProp(protoOf(WebPartyEngine), 'heavy', protoOf(WebPartyEngine).jo);
defineProp(protoOf(WebPartyEngine), 'grit', protoOf(WebPartyEngine).ko);
defineProp(protoOf(WebPartyEngine), 'snare', protoOf(WebPartyEngine).lo);
defineProp(protoOf(WebPartyEngine), 'crash', protoOf(WebPartyEngine).mo);
defineProp(protoOf(WebPartyEngine), 'sub', protoOf(WebPartyEngine).no);
defineProp(protoOf(WebPartyEngine), 'screech', protoOf(WebPartyEngine).oo);
defineProp(protoOf(WebPartyEngine), 'vocal', protoOf(WebPartyEngine).po);
defineProp(protoOf(WebPartyEngine), 'vocalHit', protoOf(WebPartyEngine).qo);
defineProp(protoOf(WebPartyEngine), 'bpm', protoOf(WebPartyEngine).ro);
defineProp(protoOf(WebPartyEngine), 'spectrum', protoOf(WebPartyEngine).so);
//endregion
//region block: init
Companion_instance = new Companion();
Unit_instance = new Unit();
_stableSortingIsSupported = null;
Companion_instance_2 = new Companion_2();
Companion_instance_4 = new Companion_4();
Companion_instance_5 = new Companion_5();
EmptyIterator_instance = new EmptyIterator();
NaturalOrderComparator_instance = new NaturalOrderComparator();
Companion_instance_8 = new Companion_8();
GenreRules_instance = new GenreRules();
//endregion
//region block: exports
export {
  raveCoreVersion as raveCoreVersion,
  WebPartyEngine as WebPartyEngine,
};
//endregion

//# sourceMappingURL=AABrowser-rave-core.mjs.map
