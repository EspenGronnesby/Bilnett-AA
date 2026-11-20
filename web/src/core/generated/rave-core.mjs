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
if (typeof Math.tanh === 'undefined') {
  var epsilon = 2.220446049250313E-16;
  var taylor_2_bound = Math.sqrt(epsilon);
  var taylor_n_bound = Math.sqrt(taylor_2_bound);
  Math.tanh = function (x) {
    if (Math.abs(x) < taylor_n_bound) {
      var result = x;
      if (Math.abs(x) > taylor_2_bound) {
        result -= x * x * x / 3;
      }
      return result;
    } else {
      var a = Math.exp(+x), b = Math.exp(-x);
      return a === Infinity ? 1 : b === Infinity ? -1 : (a - b) / (a + b);
    }
  };
}
//endregion
//region block: imports
var imul_0 = Math.imul;
var isView = ArrayBuffer.isView;
var clz32 = Math.clz32;
var hypot = Math.hypot;
var log10 = Math.log10;
var tanh = Math.tanh;
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
initMetadataForClass(AbstractMutableList, 'AbstractMutableList', VOID, AbstractMutableCollection, [KtList, Collection]);
initMetadataForClass(AbstractMutableSet, 'AbstractMutableSet', VOID, AbstractMutableCollection, [KtSet, Collection]);
initMetadataForCompanion(Companion_1);
initMetadataForClass(ArrayList, 'ArrayList', ArrayList_init_$Create$, AbstractMutableList, [KtList, Collection]);
initMetadataForClass(HashSet, 'HashSet', HashSet_init_$Create$, AbstractMutableSet, [KtSet, Collection]);
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
      tmp = m.n();
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
        tmp_0 = this.t3(entry);
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
initMetadataForClass(LinkedHashSet, 'LinkedHashSet', LinkedHashSet_init_$Create$, HashSet, [KtSet, Collection]);
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
initMetadataForCompanion(Companion_4);
initMetadataForCompanion(Companion_5);
initMetadataForObject(EmptyList, 'EmptyList', VOID, VOID, [KtList]);
initMetadataForObject(EmptyIterator, 'EmptyIterator');
initMetadataForClass(IntIterator, 'IntIterator');
initMetadataForClass(TransformingSequence$iterator$1);
initMetadataForClass(TransformingSequence, 'TransformingSequence');
initMetadataForObject(EmptySet, 'EmptySet', VOID, VOID, [KtSet]);
initMetadataForObject(NaturalOrderComparator, 'NaturalOrderComparator', VOID, VOID, [Comparator]);
initMetadataForClass(EnumEntriesList, 'EnumEntriesList', VOID, AbstractList, [KtList]);
initMetadataForClass(Random, 'Random');
initMetadataForObject(Default, 'Default', VOID, Random);
initMetadataForCompanion(Companion_6);
initMetadataForClass(XorWowRandom, 'XorWowRandom', VOID, Random);
initMetadataForCompanion(Companion_7);
initMetadataForClass(IntProgression, 'IntProgression');
function contains(value) {
  return compareTo(value, this.t4()) >= 0 && compareTo(value, this.q6()) < 0;
}
initMetadataForInterface(OpenEndRange, 'OpenEndRange');
initMetadataForClass(IntRange, 'IntRange', VOID, IntProgression, [OpenEndRange]);
initMetadataForClass(IntProgressionIterator, 'IntProgressionIterator', VOID, IntIterator);
initMetadataForCompanion(Companion_8);
initMetadataForClass(OpenEndFloatRange, 'OpenEndFloatRange', VOID, VOID, [OpenEndRange]);
initMetadataForClass(Pair, 'Pair');
initMetadataForClass(DisplaySpectrum, 'DisplaySpectrum', DisplaySpectrum);
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
initMetadataForClass(OrbBandSpec, 'OrbBandSpec');
initMetadataForClass(OrbLayerSpec, 'OrbLayerSpec');
initMetadataForClass(OrbSource, 'OrbSource', VOID, Enum);
initMetadataForClass(OrbGeometry, 'OrbGeometry', OrbGeometry);
initMetadataForClass(PcmFft, 'PcmFft');
initMetadataForObject(RaveLog, 'RaveLog');
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
  sort(this_0);
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
function firstOrNull(_this__u8e3s4) {
  return _this__u8e3s4.n() ? null : _this__u8e3s4.m(0);
}
function contains_0(_this__u8e3s4, element) {
  if (isInterface(_this__u8e3s4, Collection))
    return _this__u8e3s4.o(element);
  return indexOf_0(_this__u8e3s4, element) >= 0;
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
function indexOf_0(_this__u8e3s4, element) {
  if (isInterface(_this__u8e3s4, KtList))
    return _this__u8e3s4.p(element);
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
    switch (_this__u8e3s4.q()) {
      case 0:
        tmp = emptySet();
        break;
      case 1:
        var tmp_0;
        if (isInterface(_this__u8e3s4, KtList)) {
          tmp_0 = _this__u8e3s4.m(0);
        } else {
          tmp_0 = _this__u8e3s4.j().l();
        }

        tmp = setOf(tmp_0);
        break;
      default:
        tmp = toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$_0(mapCapacity(_this__u8e3s4.q())));
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
  this.r_1 = $this_asSequence;
}
protoOf(asSequence$$inlined$Sequence$1).j = function () {
  return this.r_1.j();
};
function downTo(_this__u8e3s4, to) {
  return Companion_instance_8.s(_this__u8e3s4, to, -1);
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
  this.x_1 = name;
  this.y_1 = ordinal;
}
protoOf(Enum).z = function (other) {
  return compareTo(this.y_1, other.y_1);
};
protoOf(Enum).d = function (other) {
  return this.z(other instanceof Enum ? other : THROW_CCE());
};
protoOf(Enum).equals = function (other) {
  return this === other;
};
protoOf(Enum).hashCode = function () {
  return identityHashCode(this);
};
protoOf(Enum).toString = function () {
  return this.x_1;
};
function toString_0(_this__u8e3s4) {
  var tmp1_elvis_lhs = _this__u8e3s4 == null ? null : toString_1(_this__u8e3s4);
  return tmp1_elvis_lhs == null ? 'null' : tmp1_elvis_lhs;
}
function Companion_0() {
  Companion_instance_0 = this;
  this.a1_1 = new Long(0, -2147483648);
  this.b1_1 = new Long(-1, 2147483647);
  this.c1_1 = 8;
  this.d1_1 = 64;
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
  this.e1_1 = low;
  this.f1_1 = high;
}
protoOf(Long).g1 = function (other) {
  return compare(this, other);
};
protoOf(Long).d = function (other) {
  return this.g1(other instanceof Long ? other : THROW_CCE());
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
function booleanArray(size) {
  var tmp0 = 'BooleanArray';
  // Inline function 'withType' call
  var array = fillArrayVal(Array(size), false);
  array.$type$ = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  return array;
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
  return _this__u8e3s4.e1_1;
}
function toNumber(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.f1_1 * 4.294967296E9 + getLowBitsUnsigned(_this__u8e3s4);
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
  return _this__u8e3s4.f1_1 === other.f1_1 && _this__u8e3s4.e1_1 === other.e1_1;
}
function hashCode(l) {
  _init_properties_boxedLong_kt__v24qrw();
  return l.e1_1 ^ l.f1_1;
}
function fromInt(value) {
  _init_properties_boxedLong_kt__v24qrw();
  return new Long(value, value < 0 ? -1 : 0);
}
function isNegative(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.f1_1 < 0;
}
function subtract(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return add(_this__u8e3s4, negate(other));
}
function getLowBitsUnsigned(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.e1_1 >= 0 ? _this__u8e3s4.e1_1 : 4.294967296E9 + _this__u8e3s4.e1_1;
}
function isZero(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return _this__u8e3s4.f1_1 === 0 && _this__u8e3s4.e1_1 === 0;
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
  var a48 = _this__u8e3s4.f1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.f1_1 & 65535;
  var a16 = _this__u8e3s4.e1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.e1_1 & 65535;
  var b48 = other.f1_1 >>> 16 | 0;
  var b32 = other.f1_1 & 65535;
  var b16 = other.e1_1 >>> 16 | 0;
  var b00 = other.e1_1 & 65535;
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
  var a48 = _this__u8e3s4.f1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.f1_1 & 65535;
  var a16 = _this__u8e3s4.e1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.e1_1 & 65535;
  var b48 = other.f1_1 >>> 16 | 0;
  var b32 = other.f1_1 & 65535;
  var b16 = other.e1_1 >>> 16 | 0;
  var b00 = other.e1_1 & 65535;
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
  return (_this__u8e3s4.e1_1 & 1) === 1;
}
function lessThan(_this__u8e3s4, other) {
  _init_properties_boxedLong_kt__v24qrw();
  return compare(_this__u8e3s4, other) < 0;
}
function invert(_this__u8e3s4) {
  _init_properties_boxedLong_kt__v24qrw();
  return new Long(~_this__u8e3s4.e1_1, ~_this__u8e3s4.f1_1);
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
      return new Long(_this__u8e3s4.e1_1 >>> numBits_0 | 0 | _this__u8e3s4.f1_1 << (32 - numBits_0 | 0), _this__u8e3s4.f1_1 >> numBits_0);
    } else {
      return new Long(_this__u8e3s4.f1_1 >> (numBits_0 - 32 | 0), _this__u8e3s4.f1_1 >= 0 ? 0 : -1);
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
      return new Long(_this__u8e3s4.e1_1 << numBits_0, _this__u8e3s4.f1_1 << numBits_0 | (_this__u8e3s4.e1_1 >>> (32 - numBits_0 | 0) | 0));
    } else {
      return new Long(0, _this__u8e3s4.e1_1 << (numBits_0 - 32 | 0));
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
  Companion_instance_4.j1(fromIndex, toIndex, _this__u8e3s4.length);
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
  Companion_instance_4.j1(fromIndex, toIndex, _this__u8e3s4.length);
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
function asList(_this__u8e3s4) {
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return new ArrayList(_this__u8e3s4);
}
function toTypedArray(_this__u8e3s4) {
  return [].slice.call(_this__u8e3s4);
}
function sort(_this__u8e3s4) {
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
  var index = binarySearchRange(Digit_getInstance().k1_1, ch);
  var diff = ch - Digit_getInstance().k1_1[index] | 0;
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
  tmp.k1_1 = new Int32Array([48, 1632, 1776, 1984, 2406, 2534, 2662, 2790, 2918, 3046, 3174, 3302, 3430, 3558, 3664, 3792, 3872, 4160, 4240, 6112, 6160, 6470, 6608, 6784, 6800, 6992, 7088, 7232, 7248, 42528, 43216, 43264, 43472, 43504, 43600, 44016, 65296]);
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
function isFinite(_this__u8e3s4) {
  return !isInfinite(_this__u8e3s4) && !isNaN_1(_this__u8e3s4);
}
function isInfinite(_this__u8e3s4) {
  return _this__u8e3s4 === Infinity || _this__u8e3s4 === -Infinity;
}
function isNaN_1(_this__u8e3s4) {
  return !(_this__u8e3s4 === _this__u8e3s4);
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
function checkIndexOverflow(index) {
  if (index < 0) {
    throwIndexOverflow();
  }
  return index;
}
function arrayCopy(source, destination, destinationOffset, startIndex, endIndex) {
  Companion_instance_4.j1(startIndex, endIndex, source.length);
  var rangeSize = endIndex - startIndex | 0;
  Companion_instance_4.j1(destinationOffset, destinationOffset + rangeSize | 0, destination.length);
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
function setOf(element) {
  return hashSetOf([element]);
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
protoOf(AbstractMutableCollection).l1 = function () {
};
function IteratorImpl($outer) {
  this.o1_1 = $outer;
  this.m1_1 = 0;
  this.n1_1 = -1;
}
protoOf(IteratorImpl).k = function () {
  return this.m1_1 < this.o1_1.q();
};
protoOf(IteratorImpl).l = function () {
  if (!this.k())
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.m1_1;
  this.m1_1 = _unary__edvuaz + 1 | 0;
  tmp.n1_1 = _unary__edvuaz;
  return this.o1_1.m(this.n1_1);
};
function AbstractMutableList() {
  AbstractMutableCollection.call(this);
  this.p1_1 = 0;
}
protoOf(AbstractMutableList).i = function (element) {
  this.l1();
  this.q1(this.q(), element);
  return true;
};
protoOf(AbstractMutableList).j = function () {
  return new IteratorImpl(this);
};
protoOf(AbstractMutableList).o = function (element) {
  return this.p(element) >= 0;
};
protoOf(AbstractMutableList).p = function (element) {
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
protoOf(AbstractMutableList).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtList) : false))
    return false;
  return Companion_instance_4.r1(this, other);
};
protoOf(AbstractMutableList).hashCode = function () {
  return Companion_instance_4.s1(this);
};
function AbstractMutableSet() {
  AbstractMutableCollection.call(this);
}
protoOf(AbstractMutableSet).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtSet) : false))
    return false;
  return Companion_instance_5.t1(this, other);
};
protoOf(AbstractMutableSet).hashCode = function () {
  return Companion_instance_5.u1(this);
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
  tmp.v1_1 = this_0;
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
function rangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_4.w1(index, $this.q());
  return index;
}
function insertionRangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_4.x1(index, $this.q());
  return index;
}
function ArrayList(array) {
  Companion_getInstance_1();
  AbstractMutableList.call(this);
  this.g_1 = array;
  this.h_1 = false;
}
protoOf(ArrayList).q = function () {
  return this.g_1.length;
};
protoOf(ArrayList).m = function (index) {
  return this.g_1[rangeCheck(this, index)];
};
protoOf(ArrayList).i = function (element) {
  this.l1();
  // Inline function 'kotlin.js.asDynamic' call
  this.g_1.push(element);
  this.p1_1 = this.p1_1 + 1 | 0;
  return true;
};
protoOf(ArrayList).q1 = function (index, element) {
  this.l1();
  // Inline function 'kotlin.js.asDynamic' call
  this.g_1.splice(insertionRangeCheck(this, index), 0, element);
  this.p1_1 = this.p1_1 + 1 | 0;
};
protoOf(ArrayList).p = function (element) {
  return indexOf(this.g_1, element);
};
protoOf(ArrayList).toString = function () {
  return arrayToString(this.g_1);
};
protoOf(ArrayList).y1 = function () {
  return [].slice.call(this.g_1);
};
protoOf(ArrayList).toArray = function () {
  return this.y1();
};
protoOf(ArrayList).l1 = function () {
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
function getStableSortingIsSupported$lambda(a, b) {
  return (a & 3) - (b & 3) | 0;
}
function HashSet_init_$Init$(map, $this) {
  AbstractMutableSet.call($this);
  HashSet.call($this);
  $this.z1_1 = map;
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
  return this.z1_1.a2(element, true) == null;
};
protoOf(HashSet).o = function (element) {
  return this.z1_1.b2(element);
};
protoOf(HashSet).n = function () {
  return this.z1_1.q() === 0;
};
protoOf(HashSet).j = function () {
  return this.z1_1.c2();
};
protoOf(HashSet).q = function () {
  return this.z1_1.q();
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
  if (!($this.n2_1.k2_1 === $this.p2_1))
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
  return $this.d2_1.length;
}
function _get_hashSize__tftcho($this) {
  return $this.g2_1.length;
}
function registerModification($this) {
  $this.k2_1 = $this.k2_1 + 1 | 0;
}
function ensureExtraCapacity($this, n) {
  if (shouldCompact($this, n)) {
    compact($this, true);
  } else {
    ensureCapacity($this, $this.i2_1 + n | 0);
  }
}
function shouldCompact($this, extraCapacity) {
  var spareCapacity = _get_capacity__a9k9f3($this) - $this.i2_1 | 0;
  var gaps = $this.i2_1 - $this.q() | 0;
  return spareCapacity < extraCapacity && (gaps + spareCapacity | 0) >= extraCapacity && gaps >= (_get_capacity__a9k9f3($this) / 4 | 0);
}
function ensureCapacity($this, minCapacity) {
  if (minCapacity < 0)
    throw RuntimeException_init_$Create$_0('too many elements');
  if (minCapacity > _get_capacity__a9k9f3($this)) {
    var newSize = Companion_instance_4.q2(_get_capacity__a9k9f3($this), minCapacity);
    $this.d2_1 = copyOfUninitializedElements($this.d2_1, newSize);
    var tmp = $this;
    var tmp0_safe_receiver = $this.e2_1;
    tmp.e2_1 = tmp0_safe_receiver == null ? null : copyOfUninitializedElements(tmp0_safe_receiver, newSize);
    $this.f2_1 = copyOf($this.f2_1, newSize);
    var newHashSize = computeHashSize(Companion_instance_2, newSize);
    if (newHashSize > _get_hashSize__tftcho($this)) {
      rehash($this, newHashSize);
    }
  }
}
function allocateValuesArray($this) {
  var curValuesArray = $this.e2_1;
  if (!(curValuesArray == null))
    return curValuesArray;
  var newValuesArray = arrayOfUninitializedElements(_get_capacity__a9k9f3($this));
  $this.e2_1 = newValuesArray;
  return newValuesArray;
}
function hash($this, key) {
  return key == null ? 0 : imul_0(hashCode_0(key), -1640531527) >>> $this.j2_1 | 0;
}
function compact($this, updateHashArray) {
  var i = 0;
  var j = 0;
  var valuesArray = $this.e2_1;
  while (i < $this.i2_1) {
    var hash = $this.f2_1[i];
    if (hash >= 0) {
      $this.d2_1[j] = $this.d2_1[i];
      if (!(valuesArray == null)) {
        valuesArray[j] = valuesArray[i];
      }
      if (updateHashArray) {
        $this.f2_1[j] = hash;
        $this.g2_1[hash] = j + 1 | 0;
      }
      j = j + 1 | 0;
    }
    i = i + 1 | 0;
  }
  resetRange($this.d2_1, j, $this.i2_1);
  if (valuesArray == null)
    null;
  else {
    resetRange(valuesArray, j, $this.i2_1);
  }
  $this.i2_1 = j;
}
function rehash($this, newHashSize) {
  registerModification($this);
  if ($this.i2_1 > $this.l2_1) {
    compact($this, false);
  }
  $this.g2_1 = new Int32Array(newHashSize);
  $this.j2_1 = computeShift(Companion_instance_2, newHashSize);
  var i = 0;
  while (i < $this.i2_1) {
    var _unary__edvuaz = i;
    i = _unary__edvuaz + 1 | 0;
    if (!putRehash($this, _unary__edvuaz)) {
      throw IllegalStateException_init_$Create$_0('This cannot happen with fixed magic multiplier and grow-only hash array. Have object hashCodes changed?');
    }
  }
}
function putRehash($this, i) {
  var hash_0 = hash($this, $this.d2_1[i]);
  var probesLeft = $this.h2_1;
  while (true) {
    var index = $this.g2_1[hash_0];
    if (index === 0) {
      $this.g2_1[hash_0] = i + 1 | 0;
      $this.f2_1[i] = hash_0;
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
  var probesLeft = $this.h2_1;
  while (true) {
    var index = $this.g2_1[hash_0];
    if (index === 0)
      return -1;
    if (equals($this.d2_1[index - 1 | 0], key))
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
  $this.r2();
  retry: while (true) {
    var hash_0 = hash($this, key);
    var tentativeMaxProbeDistance = coerceAtMost(imul_0($this.h2_1, 2), _get_hashSize__tftcho($this) / 2 | 0);
    var probeDistance = 0;
    while (true) {
      var index = $this.g2_1[hash_0];
      if (index === 0) {
        if ($this.i2_1 >= _get_capacity__a9k9f3($this)) {
          ensureExtraCapacity($this, 1);
          continue retry;
        }
        var _unary__edvuaz = $this.i2_1;
        $this.i2_1 = _unary__edvuaz + 1 | 0;
        var putIndex = _unary__edvuaz;
        $this.d2_1[putIndex] = key;
        $this.f2_1[putIndex] = hash_0;
        $this.g2_1[hash_0] = putIndex + 1 | 0;
        $this.l2_1 = $this.l2_1 + 1 | 0;
        registerModification($this);
        if (probeDistance > $this.h2_1)
          $this.h2_1 = probeDistance;
        return putIndex;
      }
      if (equals($this.d2_1[index - 1 | 0], key)) {
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
  return $this.l2_1 === other.q() && $this.s2(other.w());
}
function Companion_2() {
  this.t2_1 = -1640531527;
  this.u2_1 = 8;
  this.v2_1 = 2;
  this.w2_1 = -1;
}
var Companion_instance_2;
function Companion_getInstance_2() {
  return Companion_instance_2;
}
function Itr(map) {
  this.x2_1 = map;
  this.y2_1 = 0;
  this.z2_1 = -1;
  this.a3_1 = this.x2_1.k2_1;
  this.b3();
}
protoOf(Itr).b3 = function () {
  while (this.y2_1 < this.x2_1.i2_1 && this.x2_1.f2_1[this.y2_1] < 0) {
    this.y2_1 = this.y2_1 + 1 | 0;
  }
};
protoOf(Itr).k = function () {
  return this.y2_1 < this.x2_1.i2_1;
};
protoOf(Itr).c3 = function () {
  if (!(this.x2_1.k2_1 === this.a3_1))
    throw ConcurrentModificationException_init_$Create$();
};
function KeysItr(map) {
  Itr.call(this, map);
}
protoOf(KeysItr).l = function () {
  this.c3();
  if (this.y2_1 >= this.x2_1.i2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.y2_1;
  this.y2_1 = _unary__edvuaz + 1 | 0;
  tmp.z2_1 = _unary__edvuaz;
  var result = this.x2_1.d2_1[this.z2_1];
  this.b3();
  return result;
};
function EntriesItr(map) {
  Itr.call(this, map);
}
protoOf(EntriesItr).l = function () {
  this.c3();
  if (this.y2_1 >= this.x2_1.i2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.y2_1;
  this.y2_1 = _unary__edvuaz + 1 | 0;
  tmp.z2_1 = _unary__edvuaz;
  var result = new EntryRef(this.x2_1, this.z2_1);
  this.b3();
  return result;
};
protoOf(EntriesItr).l3 = function () {
  if (this.y2_1 >= this.x2_1.i2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.y2_1;
  this.y2_1 = _unary__edvuaz + 1 | 0;
  tmp.z2_1 = _unary__edvuaz;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.x2_1.d2_1[this.z2_1];
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode_0(tmp0_safe_receiver);
  var tmp_0 = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = ensureNotNull(this.x2_1.e2_1)[this.z2_1];
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode_0(tmp0_safe_receiver_0);
  var result = tmp_0 ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
  this.b3();
  return result;
};
protoOf(EntriesItr).m3 = function (sb) {
  if (this.y2_1 >= this.x2_1.i2_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.y2_1;
  this.y2_1 = _unary__edvuaz + 1 | 0;
  tmp.z2_1 = _unary__edvuaz;
  var key = this.x2_1.d2_1[this.z2_1];
  if (equals(key, this.x2_1))
    sb.p3('(this Map)');
  else
    sb.o3(key);
  sb.q3(_Char___init__impl__6a9atx(61));
  var value = ensureNotNull(this.x2_1.e2_1)[this.z2_1];
  if (equals(value, this.x2_1))
    sb.p3('(this Map)');
  else
    sb.o3(value);
  this.b3();
};
function EntryRef(map, index) {
  this.n2_1 = map;
  this.o2_1 = index;
  this.p2_1 = this.n2_1.k2_1;
}
protoOf(EntryRef).u = function () {
  checkForComodification(this);
  return this.n2_1.d2_1[this.o2_1];
};
protoOf(EntryRef).v = function () {
  checkForComodification(this);
  return ensureNotNull(this.n2_1.e2_1)[this.o2_1];
};
protoOf(EntryRef).equals = function (other) {
  var tmp;
  var tmp_0;
  if (!(other == null) ? isInterface(other, Entry) : false) {
    tmp_0 = equals(other.u(), this.u());
  } else {
    tmp_0 = false;
  }
  if (tmp_0) {
    tmp = equals(other.v(), this.v());
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EntryRef).hashCode = function () {
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.u();
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode_0(tmp0_safe_receiver);
  var tmp = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = this.v();
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode_0(tmp0_safe_receiver_0);
  return tmp ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
};
protoOf(EntryRef).toString = function () {
  return toString_0(this.u()) + '=' + toString_0(this.v());
};
function InternalHashMap(keysArray, valuesArray, presenceArray, hashArray, maxProbeDistance, length) {
  this.d2_1 = keysArray;
  this.e2_1 = valuesArray;
  this.f2_1 = presenceArray;
  this.g2_1 = hashArray;
  this.h2_1 = maxProbeDistance;
  this.i2_1 = length;
  this.j2_1 = computeShift(Companion_instance_2, _get_hashSize__tftcho(this));
  this.k2_1 = 0;
  this.l2_1 = 0;
  this.m2_1 = false;
}
protoOf(InternalHashMap).q = function () {
  return this.l2_1;
};
protoOf(InternalHashMap).b2 = function (key) {
  return findKey(this, key) >= 0;
};
protoOf(InternalHashMap).a2 = function (key, value) {
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
  var it = this.r3();
  while (it.k()) {
    result = result + it.l3() | 0;
  }
  return result;
};
protoOf(InternalHashMap).toString = function () {
  var sb = StringBuilder_init_$Create$(2 + imul_0(this.l2_1, 3) | 0);
  sb.p3('{');
  var i = 0;
  var it = this.r3();
  while (it.k()) {
    if (i > 0) {
      sb.p3(', ');
    }
    it.m3(sb);
    i = i + 1 | 0;
  }
  sb.p3('}');
  return sb.toString();
};
protoOf(InternalHashMap).r2 = function () {
  if (this.m2_1)
    throw UnsupportedOperationException_init_$Create$();
};
protoOf(InternalHashMap).s3 = function (entry) {
  var index = findKey(this, entry.u());
  if (index < 0)
    return false;
  return equals(ensureNotNull(this.e2_1)[index], entry.v());
};
protoOf(InternalHashMap).t3 = function (entry) {
  return this.s3(isInterface(entry, Entry) ? entry : THROW_CCE());
};
protoOf(InternalHashMap).c2 = function () {
  return new KeysItr(this);
};
protoOf(InternalHashMap).r3 = function () {
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
  this.w3_1 = jClass;
  this.x3_1 = simpleName;
  this.y3_1 = isInstanceFunction;
}
protoOf(PrimitiveKClassImpl).z3 = function () {
  return this.w3_1;
};
protoOf(PrimitiveKClassImpl).a4 = function () {
  return this.x3_1;
};
function KClassImpl() {
}
protoOf(KClassImpl).equals = function (other) {
  var tmp;
  if (other instanceof NothingKClassImpl) {
    tmp = false;
  } else {
    if (other instanceof KClassImpl) {
      tmp = (equals(this.z3(), other.z3()) && this.a4() == other.a4());
    } else {
      tmp = false;
    }
  }
  return tmp;
};
protoOf(KClassImpl).hashCode = function () {
  var tmp0_safe_receiver = this.a4();
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : getStringHashCode(tmp0_safe_receiver);
  return tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
};
protoOf(KClassImpl).toString = function () {
  return 'class ' + this.a4();
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
  this.n3_1 = content;
}
protoOf(StringBuilder).a = function () {
  // Inline function 'kotlin.js.asDynamic' call
  return this.n3_1.length;
};
protoOf(StringBuilder).b = function (index) {
  // Inline function 'kotlin.text.getOrElse' call
  var this_0 = this.n3_1;
  var tmp;
  if (0 <= index ? index <= (charSequenceLength(this_0) - 1 | 0) : false) {
    tmp = charSequenceGet(this_0, index);
  } else {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', length: ' + this.a() + '}');
  }
  return tmp;
};
protoOf(StringBuilder).c = function (startIndex, endIndex) {
  return substring(this.n3_1, startIndex, endIndex);
};
protoOf(StringBuilder).q3 = function (value) {
  this.n3_1 = this.n3_1 + toString(value);
  return this;
};
protoOf(StringBuilder).e = function (value) {
  this.n3_1 = this.n3_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).b4 = function (value, startIndex, endIndex) {
  return this.c4(value == null ? 'null' : value, startIndex, endIndex);
};
protoOf(StringBuilder).o3 = function (value) {
  this.n3_1 = this.n3_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).p3 = function (value) {
  var tmp = this;
  var tmp_0 = this.n3_1;
  tmp.n3_1 = tmp_0 + (value == null ? 'null' : value);
  return this;
};
protoOf(StringBuilder).toString = function () {
  return this.n3_1;
};
protoOf(StringBuilder).c4 = function (value, startIndex, endIndex) {
  var stringCsq = toString_1(value);
  Companion_instance_4.d4(startIndex, endIndex, stringCsq.length);
  this.n3_1 = this.n3_1 + substring(stringCsq, startIndex, endIndex);
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
  this.e4_1 = new RegExp('[\\\\^$*+?.()|[\\]{}]', 'g');
  this.f4_1 = new RegExp('[\\\\$]', 'g');
  this.g4_1 = new RegExp('\\$', 'g');
}
var Companion_instance_3;
function Companion_getInstance_3() {
  if (Companion_instance_3 == null)
    new Companion_3();
  return Companion_instance_3;
}
function Regex(pattern, options) {
  Companion_getInstance_3();
  this.h4_1 = pattern;
  this.i4_1 = toSet_0(options);
  this.j4_1 = new RegExp(pattern, toFlags(options, 'gu'));
  this.k4_1 = null;
  this.l4_1 = null;
}
protoOf(Regex).m4 = function (input, startIndex) {
  if (startIndex < 0 || startIndex > charSequenceLength(input)) {
    throw IndexOutOfBoundsException_init_$Create$_0('Start index out of bounds: ' + startIndex + ', input length: ' + charSequenceLength(input));
  }
  return findNext(this.j4_1, toString_1(input), startIndex, this.j4_1);
};
protoOf(Regex).n4 = function (input, startIndex, $super) {
  startIndex = startIndex === VOID ? 0 : startIndex;
  return $super === VOID ? this.m4(input, startIndex) : $super.m4.call(this, input, startIndex);
};
protoOf(Regex).o4 = function (input, transform) {
  var match = this.n4(input);
  if (match == null)
    return toString_1(input);
  var lastStart = 0;
  var length = charSequenceLength(input);
  var sb = StringBuilder_init_$Create$(length);
  do {
    var foundMatch = ensureNotNull(match);
    sb.b4(input, lastStart, foundMatch.p4().t4());
    sb.e(transform(foundMatch));
    lastStart = foundMatch.p4().u4() + 1 | 0;
    match = foundMatch.l();
  }
   while (lastStart < length && !(match == null));
  if (lastStart < length) {
    sb.b4(input, lastStart, length);
  }
  return sb.toString();
};
protoOf(Regex).toString = function () {
  return this.j4_1.toString();
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
  this.v4_1 = value;
}
protoOf(MatchGroup).toString = function () {
  return 'MatchGroup(value=' + this.v4_1 + ')';
};
protoOf(MatchGroup).hashCode = function () {
  return getStringHashCode(this.v4_1);
};
protoOf(MatchGroup).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof MatchGroup))
    return false;
  if (!(this.v4_1 === other.v4_1))
    return false;
  return true;
};
function toFlags$lambda(it) {
  return it.y4_1;
}
function findNext$o$groups$o$iterator$lambda(this$0) {
  return function (it) {
    return this$0.m(it);
  };
}
function advanceToNextCharacter($this, index) {
  if (index < get_lastIndex_3($this.h5_1)) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var code1 = $this.h5_1.charCodeAt(index);
    if (55296 <= code1 ? code1 <= 56319 : false) {
      // Inline function 'kotlin.js.asDynamic' call
      // Inline function 'kotlin.js.unsafeCast' call
      var code2 = $this.h5_1.charCodeAt(index + 1 | 0);
      if (56320 <= code2 ? code2 <= 57343 : false) {
        return index + 2 | 0;
      }
    }
  }
  return index + 1 | 0;
}
function findNext$1$groups$1($match, this$0) {
  this.z4_1 = $match;
  this.a5_1 = this$0;
  AbstractCollection.call(this);
}
protoOf(findNext$1$groups$1).q = function () {
  return this.z4_1.length;
};
protoOf(findNext$1$groups$1).j = function () {
  var tmp = asSequence(get_indices_1(this));
  return map(tmp, findNext$o$groups$o$iterator$lambda(this)).j();
};
protoOf(findNext$1$groups$1).m = function (index) {
  // Inline function 'kotlin.js.get' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp0_safe_receiver = this.z4_1[index];
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
  this.i5_1 = $match;
  AbstractList.call(this);
}
protoOf(findNext$1$groupValues$1).q = function () {
  return this.i5_1.length;
};
protoOf(findNext$1$groupValues$1).m = function (index) {
  // Inline function 'kotlin.js.get' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp0_elvis_lhs = this.i5_1[index];
  return tmp0_elvis_lhs == null ? '' : tmp0_elvis_lhs;
};
function findNext$1($range, $match, $nextPattern, $input) {
  this.e5_1 = $range;
  this.f5_1 = $match;
  this.g5_1 = $nextPattern;
  this.h5_1 = $input;
  this.b5_1 = $range;
  var tmp = this;
  tmp.c5_1 = new findNext$1$groups$1($match, this);
  this.d5_1 = null;
}
protoOf(findNext$1).p4 = function () {
  return this.b5_1;
};
protoOf(findNext$1).j5 = function () {
  if (this.d5_1 == null) {
    var tmp = this;
    tmp.d5_1 = new findNext$1$groupValues$1(this.f5_1);
  }
  return ensureNotNull(this.d5_1);
};
protoOf(findNext$1).l = function () {
  return findNext(this.g5_1, this.h5_1, this.e5_1.n() ? advanceToNextCharacter(this, this.e5_1.t4()) : this.e5_1.u4() + 1 | 0, this.g5_1);
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
  this.k5_1 = function_0;
}
protoOf(sam$kotlin_Comparator$0).l5 = function (a, b) {
  return this.k5_1(a, b);
};
protoOf(sam$kotlin_Comparator$0).compare = function (a, b) {
  return this.l5(a, b);
};
protoOf(sam$kotlin_Comparator$0).h1 = function () {
  return this.k5_1;
};
protoOf(sam$kotlin_Comparator$0).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, Comparator) : false) {
    var tmp_0;
    if (!(other == null) ? isInterface(other, FunctionAdapter) : false) {
      tmp_0 = equals(this.h1(), other.h1());
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
  return hashCode_0(this.h1());
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
protoOf(AbstractCollection).o = function (element) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.any' call
    var tmp;
    if (isInterface(this, Collection)) {
      tmp = this.n();
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
protoOf(AbstractCollection).t = function (elements) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(elements, Collection)) {
      tmp = elements.n();
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
      if (!this.o(element)) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
};
protoOf(AbstractCollection).n = function () {
  return this.q() === 0;
};
protoOf(AbstractCollection).toString = function () {
  return joinToString_0(this, ', ', '[', ']', VOID, VOID, AbstractCollection$toString$lambda(this));
};
protoOf(AbstractCollection).toArray = function () {
  return collectionToArray(this);
};
function IteratorImpl_0($outer) {
  this.n5_1 = $outer;
  this.m5_1 = 0;
}
protoOf(IteratorImpl_0).k = function () {
  return this.m5_1 < this.n5_1.q();
};
protoOf(IteratorImpl_0).l = function () {
  if (!this.k())
    throw NoSuchElementException_init_$Create$();
  var _unary__edvuaz = this.m5_1;
  this.m5_1 = _unary__edvuaz + 1 | 0;
  return this.n5_1.m(_unary__edvuaz);
};
function Companion_4() {
  this.i1_1 = 2147483639;
}
protoOf(Companion_4).w1 = function (index, size) {
  if (index < 0 || index >= size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_4).x1 = function (index, size) {
  if (index < 0 || index > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_4).j1 = function (fromIndex, toIndex, size) {
  if (fromIndex < 0 || toIndex > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('fromIndex: ' + fromIndex + ', toIndex: ' + toIndex + ', size: ' + size);
  }
  if (fromIndex > toIndex) {
    throw IllegalArgumentException_init_$Create$_0('fromIndex: ' + fromIndex + ' > toIndex: ' + toIndex);
  }
};
protoOf(Companion_4).d4 = function (startIndex, endIndex, size) {
  if (startIndex < 0 || endIndex > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('startIndex: ' + startIndex + ', endIndex: ' + endIndex + ', size: ' + size);
  }
  if (startIndex > endIndex) {
    throw IllegalArgumentException_init_$Create$_0('startIndex: ' + startIndex + ' > endIndex: ' + endIndex);
  }
};
protoOf(Companion_4).q2 = function (oldCapacity, minCapacity) {
  var newCapacity = oldCapacity + (oldCapacity >> 1) | 0;
  if ((newCapacity - minCapacity | 0) < 0)
    newCapacity = minCapacity;
  if ((newCapacity - 2147483639 | 0) > 0)
    newCapacity = minCapacity > 2147483639 ? 2147483647 : 2147483639;
  return newCapacity;
};
protoOf(Companion_4).s1 = function (c) {
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
protoOf(Companion_4).r1 = function (c, other) {
  if (!(c.q() === other.q()))
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
protoOf(AbstractList).p = function (element) {
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
protoOf(AbstractList).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtList) : false))
    return false;
  return Companion_instance_4.r1(this, other);
};
protoOf(AbstractList).hashCode = function () {
  return Companion_instance_4.s1(this);
};
function Companion_5() {
}
protoOf(Companion_5).u1 = function (c) {
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
protoOf(Companion_5).t1 = function (c, other) {
  if (!(c.q() === other.q()))
    return false;
  return c.t(other);
};
var Companion_instance_5;
function Companion_getInstance_5() {
  return Companion_instance_5;
}
function throwIndexOverflow() {
  throw ArithmeticException_init_$Create$_0('Index overflow has happened.');
}
function collectionToArrayCommonImpl(collection) {
  if (collection.n()) {
    // Inline function 'kotlin.emptyArray' call
    return [];
  }
  // Inline function 'kotlin.arrayOfNulls' call
  var size = collection.q();
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
  this.o5_1 = new Long(-1478467534, -1720727600);
}
protoOf(EmptyList).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtList) : false) {
    tmp = other.n();
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
protoOf(EmptyList).q = function () {
  return 0;
};
protoOf(EmptyList).n = function () {
  return true;
};
protoOf(EmptyList).p5 = function (element) {
  return false;
};
protoOf(EmptyList).o = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.p5(tmp);
};
protoOf(EmptyList).m = function (index) {
  throw IndexOutOfBoundsException_init_$Create$_0("Empty list doesn't contain element at index " + index + '.');
};
protoOf(EmptyList).q5 = function (element) {
  return -1;
};
protoOf(EmptyList).p = function (element) {
  if (!false)
    return -1;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.q5(tmp);
};
protoOf(EmptyList).j = function () {
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
function get_indices_1(_this__u8e3s4) {
  return numberRangeToNumber(0, _this__u8e3s4.q() - 1 | 0);
}
function IntIterator() {
}
protoOf(IntIterator).l = function () {
  return this.r5();
};
function TransformingSequence$iterator$1(this$0) {
  this.t5_1 = this$0;
  this.s5_1 = this$0.u5_1.j();
}
protoOf(TransformingSequence$iterator$1).l = function () {
  return this.t5_1.v5_1(this.s5_1.l());
};
protoOf(TransformingSequence$iterator$1).k = function () {
  return this.s5_1.k();
};
function TransformingSequence(sequence, transformer) {
  this.u5_1 = sequence;
  this.v5_1 = transformer;
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
  this.w5_1 = new Long(1993859828, 793161749);
}
protoOf(EmptySet).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtSet) : false) {
    tmp = other.n();
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
protoOf(EmptySet).q = function () {
  return 0;
};
protoOf(EmptySet).n = function () {
  return true;
};
protoOf(EmptySet).p5 = function (element) {
  return false;
};
protoOf(EmptySet).o = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.p5(tmp);
};
protoOf(EmptySet).x5 = function (elements) {
  return elements.n();
};
protoOf(EmptySet).t = function (elements) {
  return this.x5(elements);
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
  switch (_this__u8e3s4.q()) {
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
protoOf(NaturalOrderComparator).y5 = function (a, b) {
  return compareTo(a, b);
};
protoOf(NaturalOrderComparator).compare = function (a, b) {
  var tmp = (!(a == null) ? isComparable(a) : false) ? a : THROW_CCE();
  return this.y5(tmp, (!(b == null) ? isComparable(b) : false) ? b : THROW_CCE());
};
var NaturalOrderComparator_instance;
function NaturalOrderComparator_getInstance() {
  return NaturalOrderComparator_instance;
}
function EnumEntriesList(entries) {
  AbstractList.call(this);
  this.z5_1 = entries;
}
protoOf(EnumEntriesList).q = function () {
  return this.z5_1.length;
};
protoOf(EnumEntriesList).m = function (index) {
  Companion_instance_4.w1(index, this.z5_1.length);
  return this.z5_1[index];
};
protoOf(EnumEntriesList).a6 = function (element) {
  if (element === null)
    return false;
  var target = getOrNull(this.z5_1, element.y_1);
  return target === element;
};
protoOf(EnumEntriesList).o = function (element) {
  if (!(element instanceof Enum))
    return false;
  return this.a6(element instanceof Enum ? element : THROW_CCE());
};
protoOf(EnumEntriesList).b6 = function (element) {
  if (element === null)
    return -1;
  var ordinal = element.y_1;
  var target = getOrNull(this.z5_1, ordinal);
  return target === element ? ordinal : -1;
};
protoOf(EnumEntriesList).p = function (element) {
  if (!(element instanceof Enum))
    return -1;
  return this.b6(element instanceof Enum ? element : THROW_CCE());
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
  this.c6_1 = defaultPlatformRandom();
}
protoOf(Default).d6 = function (bitCount) {
  return this.c6_1.d6(bitCount);
};
protoOf(Default).e6 = function () {
  return this.c6_1.e6();
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
protoOf(Random).e6 = function () {
  return doubleFromParts(this.d6(26), this.d6(27));
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
  if (!!(($this.f6_1 | $this.g6_1 | $this.h6_1 | $this.i6_1 | $this.j6_1) === 0)) {
    var message = 'Initial state must have at least one non-zero element.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
}
function Companion_6() {
  Companion_instance_6 = this;
  this.l6_1 = new Long(0, 0);
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
  this.f6_1 = x;
  this.g6_1 = y;
  this.h6_1 = z;
  this.i6_1 = w;
  this.j6_1 = v;
  this.k6_1 = addend;
  checkInvariants(this);
  // Inline function 'kotlin.repeat' call
  var inductionVariable = 0;
  if (inductionVariable < 64)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      this.r5();
    }
     while (inductionVariable < 64);
}
protoOf(XorWowRandom).r5 = function () {
  var t = this.f6_1;
  t = t ^ (t >>> 2 | 0);
  this.f6_1 = this.g6_1;
  this.g6_1 = this.h6_1;
  this.h6_1 = this.i6_1;
  var v0 = this.j6_1;
  this.i6_1 = v0;
  t = t ^ t << 1 ^ v0 ^ v0 << 4;
  this.j6_1 = t;
  this.k6_1 = this.k6_1 + 362437 | 0;
  return t + this.k6_1 | 0;
};
protoOf(XorWowRandom).d6 = function (bitCount) {
  return takeUpperBits(this.r5(), bitCount);
};
function Companion_7() {
  Companion_instance_7 = this;
  this.m6_1 = new IntRange(1, 0);
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
protoOf(IntRange).t4 = function () {
  return this.n6_1;
};
protoOf(IntRange).u4 = function () {
  return this.o6_1;
};
protoOf(IntRange).q6 = function () {
  if (this.o6_1 === 2147483647) {
    // Inline function 'kotlin.error' call
    var message = 'Cannot return the exclusive upper bound of a range that includes MAX_VALUE.';
    throw IllegalStateException_init_$Create$_0(toString_1(message));
  }
  return this.o6_1 + 1 | 0;
};
protoOf(IntRange).r6 = function (value) {
  return this.n6_1 <= value && value <= this.o6_1;
};
protoOf(IntRange).s6 = function (value) {
  return this.r6(typeof value === 'number' ? value : THROW_CCE());
};
protoOf(IntRange).n = function () {
  return this.n6_1 > this.o6_1;
};
protoOf(IntRange).equals = function (other) {
  var tmp;
  if (other instanceof IntRange) {
    tmp = this.n() && other.n() || (this.n6_1 === other.n6_1 && this.o6_1 === other.o6_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntRange).hashCode = function () {
  return this.n() ? -1 : imul_0(31, this.n6_1) + this.o6_1 | 0;
};
protoOf(IntRange).toString = function () {
  return '' + this.n6_1 + '..' + this.o6_1;
};
function IntProgressionIterator(first, last, step) {
  IntIterator.call(this);
  this.t6_1 = step;
  this.u6_1 = last;
  this.v6_1 = this.t6_1 > 0 ? first <= last : first >= last;
  this.w6_1 = this.v6_1 ? first : this.u6_1;
}
protoOf(IntProgressionIterator).k = function () {
  return this.v6_1;
};
protoOf(IntProgressionIterator).r5 = function () {
  var value = this.w6_1;
  if (value === this.u6_1) {
    if (!this.v6_1)
      throw NoSuchElementException_init_$Create$();
    this.v6_1 = false;
  } else {
    this.w6_1 = this.w6_1 + this.t6_1 | 0;
  }
  return value;
};
function Companion_8() {
}
protoOf(Companion_8).s = function (rangeStart, rangeEnd, step) {
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
  this.n6_1 = start;
  this.o6_1 = getProgressionLastElement(start, endInclusive, step);
  this.p6_1 = step;
}
protoOf(IntProgression).j = function () {
  return new IntProgressionIterator(this.n6_1, this.o6_1, this.p6_1);
};
protoOf(IntProgression).n = function () {
  return this.p6_1 > 0 ? this.n6_1 > this.o6_1 : this.n6_1 < this.o6_1;
};
protoOf(IntProgression).equals = function (other) {
  var tmp;
  if (other instanceof IntProgression) {
    tmp = this.n() && other.n() || (this.n6_1 === other.n6_1 && this.o6_1 === other.o6_1 && this.p6_1 === other.p6_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntProgression).hashCode = function () {
  return this.n() ? -1 : imul_0(31, imul_0(31, this.n6_1) + this.o6_1 | 0) + this.p6_1 | 0;
};
protoOf(IntProgression).toString = function () {
  return this.p6_1 > 0 ? '' + this.n6_1 + '..' + this.o6_1 + ' step ' + this.p6_1 : '' + this.n6_1 + ' downTo ' + this.o6_1 + ' step ' + (-this.p6_1 | 0);
};
function OpenEndRange() {
}
function rangeUntil(_this__u8e3s4, that) {
  return new OpenEndFloatRange(_this__u8e3s4, that);
}
function OpenEndFloatRange(start, endExclusive) {
  this.x6_1 = start;
  this.y6_1 = endExclusive;
}
protoOf(OpenEndFloatRange).t4 = function () {
  return this.x6_1;
};
protoOf(OpenEndFloatRange).q6 = function () {
  return this.y6_1;
};
protoOf(OpenEndFloatRange).z6 = function (value) {
  return value >= this.x6_1 && value < this.y6_1;
};
protoOf(OpenEndFloatRange).s6 = function (value) {
  return this.z6(typeof value === 'number' ? value : THROW_CCE());
};
protoOf(OpenEndFloatRange).n = function () {
  return !(this.x6_1 < this.y6_1);
};
protoOf(OpenEndFloatRange).equals = function (other) {
  var tmp;
  if (other instanceof OpenEndFloatRange) {
    tmp = this.n() && other.n() || (this.x6_1 === other.x6_1 && this.y6_1 === other.y6_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(OpenEndFloatRange).hashCode = function () {
  return this.n() ? -1 : imul_0(31, getNumberHashCode(this.x6_1)) + getNumberHashCode(this.y6_1) | 0;
};
protoOf(OpenEndFloatRange).toString = function () {
  return '' + this.x6_1 + '..<' + this.y6_1;
};
function appendElement(_this__u8e3s4, element, transform) {
  if (!(transform == null))
    _this__u8e3s4.e(transform(element));
  else {
    if (element == null ? true : isCharSequence(element))
      _this__u8e3s4.e(element);
    else {
      if (element instanceof Char)
        _this__u8e3s4.q3(element.a7_1);
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
  var indices = !last ? numberRangeToNumber(coerceAtLeast(startIndex, 0), coerceAtMost(endIndex, charSequenceLength(_this__u8e3s4))) : downTo(coerceAtMost(startIndex, get_lastIndex_3(_this__u8e3s4)), coerceAtLeast(endIndex, 0));
  var tmp;
  if (typeof _this__u8e3s4 === 'string') {
    tmp = typeof other === 'string';
  } else {
    tmp = false;
  }
  if (tmp) {
    var inductionVariable = indices.n6_1;
    var last_0 = indices.o6_1;
    var step = indices.p6_1;
    if (step > 0 && inductionVariable <= last_0 || (step < 0 && last_0 <= inductionVariable))
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + step | 0;
        if (regionMatches(other, 0, _this__u8e3s4, index, other.length, ignoreCase))
          return index;
      }
       while (!(index === last_0));
  } else {
    var inductionVariable_0 = indices.n6_1;
    var last_1 = indices.o6_1;
    var step_0 = indices.p6_1;
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
      sb.q3(padChar);
    }
     while (!(i === last));
  sb.e(_this__u8e3s4);
  return sb;
}
function get_lastIndex_3(_this__u8e3s4) {
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
  this.b7_1 = first;
  this.c7_1 = second;
}
protoOf(Pair).toString = function () {
  return '(' + toString_0(this.b7_1) + ', ' + toString_0(this.c7_1) + ')';
};
protoOf(Pair).d7 = function () {
  return this.b7_1;
};
protoOf(Pair).e7 = function () {
  return this.c7_1;
};
protoOf(Pair).hashCode = function () {
  var result = this.b7_1 == null ? 0 : hashCode_0(this.b7_1);
  result = imul_0(result, 31) + (this.c7_1 == null ? 0 : hashCode_0(this.c7_1)) | 0;
  return result;
};
protoOf(Pair).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof Pair))
    return false;
  if (!equals(this.b7_1, other.b7_1))
    return false;
  if (!equals(this.c7_1, other.c7_1))
    return false;
  return true;
};
function to(_this__u8e3s4, that) {
  return new Pair(_this__u8e3s4, that);
}
function displayBandHz(band) {
  var tmp0 = 10000.0 / 40.0;
  // Inline function 'kotlin.math.pow' call
  var x = band / 95;
  return 40.0 * Math.pow(tmp0, x);
}
function displayBandAt(hz) {
  // Inline function 'kotlin.math.ln' call
  var x = hz / 40.0;
  var tmp = 95 * Math.log(x);
  // Inline function 'kotlin.math.ln' call
  var x_0 = 10000.0 / 40.0;
  var tmp$ret$1 = Math.log(x_0);
  return coerceIn(tmp / tmp$ret$1, 0.0, 95);
}
function magnitude($this, fft, bin, lastBin) {
  var tmp;
  if (1 <= bin ? bin <= lastBin : false) {
    var tmp0 = fft[imul_0(bin, 2)];
    // Inline function 'kotlin.math.hypot' call
    var y = fft[imul_0(bin, 2) + 1 | 0];
    tmp = hypot(tmp0, y);
  } else {
    tmp = 0.0;
  }
  return tmp;
}
function layout($this, sampleRate, size) {
  $this.l7_1 = sampleRate;
  $this.m7_1 = size;
  var binHz = sampleRate / size;
  var lastBin = (size / 2 | 0) - 1 | 0;
  var tmp0 = 10000.0 / 40.0;
  // Inline function 'kotlin.math.pow' call
  var x = 0.5 / 95;
  var halfWidth = Math.pow(tmp0, x);
  var inductionVariable = 0;
  if (inductionVariable < 96)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var hz = displayBandHz(i);
      $this.h7_1[i] = hz / binHz;
      // Inline function 'kotlin.math.ceil' call
      var x_0 = hz / halfWidth / binHz;
      var tmp$ret$1 = Math.ceil(x_0);
      // Inline function 'kotlin.math.max' call
      var b = numberToInt(tmp$ret$1);
      var tmp$ret$2 = Math.max(1, b);
      $this.i7_1[i] = tmp$ret$2;
      // Inline function 'kotlin.math.floor' call
      var x_1 = hz * halfWidth / binHz;
      var tmp$ret$3 = Math.floor(x_1);
      // Inline function 'kotlin.math.min' call
      var b_0 = numberToInt(tmp$ret$3);
      var tmp$ret$4 = Math.min(lastBin, b_0);
      $this.j7_1[i] = tmp$ret$4;
      $this.k7_1[i] = hz < sampleRate / 2.0;
    }
     while (inductionVariable < 96);
}
function DisplaySpectrum() {
  this.f7_1 = new Float32Array(96);
  this.g7_1 = 0;
  this.h7_1 = new Float32Array(96);
  this.i7_1 = new Int32Array(96);
  this.j7_1 = new Int32Array(96);
  this.k7_1 = booleanArray(96);
  this.l7_1 = 0;
  this.m7_1 = 0;
}
protoOf(DisplaySpectrum).n7 = function () {
  fill_0(this.f7_1, 0.0);
  this.g7_1 = this.g7_1 + 1 | 0;
};
protoOf(DisplaySpectrum).o7 = function (fft, sampleRate) {
  if (sampleRate <= 0 || fft.length < 4)
    return Unit_instance;
  if (!(sampleRate === this.l7_1) || !(fft.length === this.m7_1)) {
    layout(this, sampleRate, fft.length);
  }
  var lastBin = (fft.length / 2 | 0) - 1 | 0;
  var inductionVariable = 0;
  if (inductionVariable < 96)
    $l$loop: do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (!this.k7_1[i]) {
        this.f7_1[i] = 0.0;
        continue $l$loop;
      }
      var lower = numberToInt(this.h7_1[i]);
      var fraction = this.h7_1[i] - lower;
      var value = magnitude(this, fft, lower, lastBin) * (1.0 - fraction) + magnitude(this, fft, lower + 1 | 0, lastBin) * fraction;
      var inductionVariable_0 = this.i7_1[i];
      var last = this.j7_1[i];
      if (inductionVariable_0 <= last)
        do {
          var bin = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var tmp0 = value;
          // Inline function 'kotlin.math.max' call
          var b = magnitude(this, fft, bin, lastBin);
          value = Math.max(tmp0, b);
        }
         while (!(bin === last));
      this.f7_1[i] = value;
    }
     while (inductionVariable < 96);
  this.g7_1 = this.g7_1 + 1 | 0;
};
function BeatClock() {
  this.p7_1 = -1.0;
  this.q7_1 = new Long(0, 0);
  this.r7_1 = false;
}
protoOf(BeatClock).n7 = function () {
  this.p7_1 = -1.0;
  this.q7_1 = new Long(0, 0);
  this.r7_1 = false;
};
protoOf(BeatClock).s7 = function (f, now, leadMs, halfTime, decayMs) {
  var beatP = f.p8_1;
  this.r7_1 = (f.q8_1 >= 3 && beatP > 0.0 && compare(f.o8_1, new Long(0, 0)) > 0 && toNumber(subtract(now, f.o8_1)) < beatP * 1.6);
  if (!this.r7_1) {
    this.p7_1 = -1.0;
    return null;
  }
  var p = halfTime ? beatP * 2.0 : beatP;
  var anchor = halfTime ? subtract(f.o8_1, multiply(numberToLong(f.n8_1 % 2 | 0), numberToLong(beatP))) : f.o8_1;
  // Inline function 'kotlin.Long.plus' call
  var since = ((toNumber(now) + leadMs - toNumber(anchor)) % p + p) % p;
  if (this.p7_1 >= 0.0 && since < this.p7_1 && toNumber(subtract(now, this.q7_1)) > p * 0.6)
    this.q7_1 = now;
  this.p7_1 = since;
  // Inline function 'kotlin.Long.div' call
  var this_0 = negate(subtract(now, this.q7_1));
  // Inline function 'kotlin.math.exp' call
  var x = toNumber(this_0) / decayMs;
  return Math.exp(x);
};
protoOf(BeatClock).w8 = function (f, now, leadMs, halfTime, decayMs, $super) {
  leadMs = leadMs === VOID ? 70.0 : leadMs;
  halfTime = halfTime === VOID ? false : halfTime;
  decayMs = decayMs === VOID ? 85.0 : decayMs;
  return $super === VOID ? this.s7(f, now, leadMs, halfTime, decayMs) : $super.s7.call(this, f, now, leadMs, halfTime, decayMs);
};
function FlashBudget() {
  this.x8_1 = longArray(3);
}
protoOf(FlashBudget).y8 = function (now) {
  var tmp0 = this.x8_1;
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
  var tmp0_0 = get_indices_0(this.x8_1);
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
    var minValue = this.x8_1[it];
    do {
      var e = iterator.l();
      var v = this.x8_1[e];
      if (compareTo(minValue, v) > 0) {
        minElem = e;
        minValue = v;
      }
    }
     while (iterator.k());
    tmp$ret$2 = minElem;
  }
  var oldest = tmp$ret$2;
  if (compare(subtract(now, this.x8_1[oldest]), new Long(1000, 0)) < 0)
    return false;
  this.x8_1[oldest] = now;
  return true;
};
protoOf(FlashBudget).z8 = function (now) {
  // Inline function 'kotlin.collections.count' call
  var count = 0;
  var indexedObject = this.x8_1;
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
  this.c9_1 = label;
}
function PartyProfile(spike, particles, shake, strobe, density, softness) {
  density = density === VOID ? 1.0 : density;
  softness = softness === VOID ? 1.0 : softness;
  this.d9_1 = spike;
  this.e9_1 = particles;
  this.f9_1 = shake;
  this.g9_1 = strobe;
  this.h9_1 = density;
  this.i9_1 = softness;
}
protoOf(PartyProfile).toString = function () {
  return 'PartyProfile(spike=' + this.d9_1 + ', particles=' + this.e9_1 + ', shake=' + this.f9_1 + ', strobe=' + this.g9_1 + ', density=' + this.h9_1 + ', softness=' + this.i9_1 + ')';
};
protoOf(PartyProfile).hashCode = function () {
  var result = getNumberHashCode(this.d9_1);
  result = imul_0(result, 31) + getNumberHashCode(this.e9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.f9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.g9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.h9_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.i9_1) | 0;
  return result;
};
protoOf(PartyProfile).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof PartyProfile))
    return false;
  if (!equals(this.d9_1, other.d9_1))
    return false;
  if (!equals(this.e9_1, other.e9_1))
    return false;
  if (!equals(this.f9_1, other.f9_1))
    return false;
  if (!equals(this.g9_1, other.g9_1))
    return false;
  if (!equals(this.h9_1, other.h9_1))
    return false;
  if (!equals(this.i9_1, other.i9_1))
    return false;
  return true;
};
function profile(_this__u8e3s4) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  switch (_this__u8e3s4.y_1) {
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
  switch (_this__u8e3s4.y_1) {
    case 0:
      tmp = f;
      break;
    case 1:
      var strong = coerceIn((f.t7_1 - 0.6) / 0.3, 0.0, 1.0) * coerceAtMost_0(0.5 + f.g8_1, 1.0);
      var tmp1_kick = f.u7_1 * strong;
      var tmp2_heavy = strong * strong * 0.6;
      var tmp3_bass = f.t7_1 * 0.9;
      var tmp4_grit = f.g8_1 > 0.55 && strong > 0.6 ? 1.0 : 0.0;
      tmp = f.j9(tmp3_bass, tmp1_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp2_heavy, tmp4_grit);
      break;
    case 2:
      var tmp0 = f.e8_1;
      // Inline function 'kotlin.math.max' call

      var b = f.u7_1 * 0.6;
      var tmp5_kick = Math.max(tmp0, b);
      var tmp6_heavy = coerceAtMost_0(f.e8_1 * 0.6 + f.c8_1 * 0.4, 1.0);
      var tmp0_0 = f.t7_1 * 0.7;
      // Inline function 'kotlin.math.max' call

      var b_0 = f.e8_1;
      var tmp7_bass = Math.max(tmp0_0, b_0);
      var tmp8_grit = f.e8_1 > 0.7 ? 1.0 : 0.0;
      tmp = f.j9(tmp7_bass, tmp5_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp6_heavy, tmp8_grit);
      break;
    case 3:
      var tmp0_1 = f.b8_1;
      // Inline function 'kotlin.math.max' call

      var b_1 = f.w7_1 * 0.6 * f.u7_1;
      var tmp$ret$2 = Math.max(tmp0_1, b_1);
      tmp = f.j9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, tmp$ret$2, f.b8_1 > 0.3 ? 1.0 : 0.0);
      break;
    case 4:
      var tmp9_kick = f.u7_1 * 0.5;
      tmp = f.j9(VOID, tmp9_kick, VOID, VOID, VOID, VOID, VOID, VOID, 0.0, 0.0);
      break;
    case 5:
    case 6:
    case 7:
      var tmp10_kick = f.u7_1 * 0.6;
      tmp = f.j9(VOID, tmp10_kick, VOID, VOID, VOID, VOID, VOID, VOID, 0.0, 0.0);
      break;
    default:
      noWhenBranchMatchedException();
      break;
  }
  return tmp;
}
function blendFrames(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return b.j9(blendFrames$l(t, a.t7_1, b.t7_1), blendFrames$l(t, a.u7_1, b.u7_1), VOID, VOID, VOID, VOID, VOID, VOID, blendFrames$l(t, a.b8_1, b.b8_1), blendFrames$l(t, a.c8_1, b.c8_1));
}
function vibeTarget(_this__u8e3s4) {
  _init_properties_GenreDetector_kt__z0odbr();
  var tmp;
  switch (_this__u8e3s4.y_1) {
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
  return coerceIn((v - 0.5) / 0.5, 0.0, 1.0);
}
function structureWeight(v) {
  _init_properties_GenreDetector_kt__z0odbr();
  return coerceIn((v - 0.25) / 0.25, 0.0, 1.0);
}
function lerpF(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return a + (b - a) * t;
}
function lerpProfile(a, b, t) {
  _init_properties_GenreDetector_kt__z0odbr();
  return new PartyProfile(lerpF(a.d9_1, b.d9_1, t), lerpF(a.e9_1, b.e9_1, t), lerpF(a.f9_1, b.f9_1, t), lerpF(a.g9_1, b.g9_1, t), lerpF(a.h9_1, b.h9_1, t), lerpF(a.i9_1, b.i9_1, t));
}
function hardFusion(f, rockness) {
  _init_properties_GenreDetector_kt__z0odbr();
  var rock = shape(Genre_ROCK_getInstance(), f);
  var edm = shape(Genre_EDM_getInstance(), f);
  var tmp0 = f.u7_1;
  // Inline function 'kotlin.math.max' call
  var b = rock.u7_1;
  var tmp0_kick = Math.max(tmp0, b);
  var tmp0_0 = f.b8_1;
  var tmp2 = rock.b8_1;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = edm.b8_1;
  var tmp1_heavy = Math.max(tmp0_0, tmp2, c);
  var tmp0_1 = f.t7_1;
  // Inline function 'kotlin.math.max' call
  var b_0 = rock.t7_1;
  var tmp2_bass = Math.max(tmp0_1, b_0);
  var tmp0_2 = f.c8_1;
  var tmp2_0 = rock.c8_1;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c_0 = edm.c8_1;
  var tmp3_grit = Math.max(tmp0_2, tmp2_0, c_0);
  return f.j9(tmp2_bass, tmp0_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp1_heavy, tmp3_grit);
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
    var scaled = fused.j9(VOID, fused.u7_1 * (0.7 + 0.3 * h), VOID, VOID, VOID, VOID, VOID, VOID, fused.b8_1 * (0.6 + 0.4 * h), fused.c8_1 * (0.8 + 0.2 * h));
    tmp = blendFrames(shape(Genre_EDM_getInstance(), f), scaled, coerceIn((v - 0.5) / 0.15, 0.0, 1.0));
  }
  return tmp;
}
function vibeProfile(v, rockness) {
  _init_properties_GenreDetector_kt__z0odbr();
  var hs = profile(Genre_HARDSTYLE_getInstance());
  var rk = profile(Genre_ROCK_getInstance());
  var tmp0 = hs.d9_1;
  // Inline function 'kotlin.math.max' call
  var b = rk.d9_1;
  var tmp = Math.max(tmp0, b);
  var tmp0_0 = hs.e9_1;
  // Inline function 'kotlin.math.max' call
  var b_0 = rk.e9_1;
  var tmp_0 = Math.max(tmp0_0, b_0);
  var tmp0_1 = hs.f9_1;
  // Inline function 'kotlin.math.max' call
  var b_1 = rk.f9_1;
  var tmp_1 = Math.max(tmp0_1, b_1);
  var tmp0_2 = hs.g9_1;
  // Inline function 'kotlin.math.max' call
  var b_2 = rk.g9_1;
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
  $this.n9_1 = now;
  $this.o9_1 = true;
}
function updateRockness($this, f, dt) {
  var tmp;
  if ($this.oa_1 || equals($this.p9_1, Genre_HARDSTYLE_getInstance()) || equals($this.q9_1, Genre_RAP_getInstance()) || contains_0(get_CALM_LOCK(), $this.q9_1) || equals($this.q9_1, Genre_STANDARD_getInstance())) {
    tmp = 0.0;
  } else {
    var tmp_0;
    var containsArg = f.d8_1;
    if (138.0 <= containsArg ? containsArg <= 250.0 : false) {
      tmp_0 = $this.ia_1 > 2.2;
    } else {
      tmp_0 = false;
    }
    if (tmp_0) {
      tmp = 0.0;
    } else {
      var fewKicks = coerceIn((2.5 - $this.ia_1) / 0.8, 0.0, 1.0);
      var snares = coerceIn(($this.ja_1 - 0.6) / 1.0, 0.0, 1.0);
      var lowSub = 1.0 - 0.5 * coerceIn(($this.ha_1 - 0.5) / 0.15, 0.0, 1.0);
      var sound = fewKicks * (0.4 + 0.6 * snares) * lowSub;
      var tmp_1;
      if (equals($this.p9_1, Genre_ROCK_getInstance())) {
        // Inline function 'kotlin.math.max' call
        tmp_1 = Math.max(sound, 0.7);
      } else {
        tmp_1 = sound;
      }
      tmp = tmp_1;
    }
  }
  var target = tmp;
  if ($this.oa_1 || equals($this.p9_1, Genre_HARDSTYLE_getInstance()) || equals($this.q9_1, Genre_RAP_getInstance()) || contains_0(get_CALM_LOCK(), $this.q9_1) || equals($this.q9_1, Genre_STANDARD_getInstance()))
    $this.pa_1 = 0.0;
  else if (f.w7_1 > 0.4) {
    var tmp_2 = $this;
    var tmp_3 = $this.pa_1;
    var tmp_4 = target - $this.pa_1;
    // Inline function 'kotlin.math.exp' call
    var x = -dt / 4.0;
    tmp_2.pa_1 = tmp_3 + tmp_4 * (1.0 - Math.exp(x));
  }
}
function audioGuess($this, bpm) {
  return $this.ga_1 > 0.25 && $this.ia_1 >= 2.3 && (138.0 <= bpm ? bpm <= 250.0 : false) ? Genre_HARDSTYLE_getInstance() : $this.ga_1 > 0.2 && $this.ha_1 > 0.53 && $this.ia_1 > 2.3 && (138.0 <= bpm ? bpm <= 250.0 : false) ? Genre_HARDSTYLE_getInstance() : $this.k9_1.equals(Genre_HARDSTYLE_getInstance()) && compare($this.m9_1, $this.ca_1) >= 0 && $this.ga_1 > 0.12 && $this.ia_1 >= 2.0 ? Genre_HARDSTYLE_getInstance() : $this.ga_1 > 0.2 && $this.ia_1 < 2.2 && $this.ha_1 < 0.5 && $this.ja_1 > 1.2 ? Genre_ROCK_getInstance() : $this.ha_1 > 0.6 && $this.ga_1 < 0.15 && (bpm < 110.0 || $this.ia_1 < 2.0) ? Genre_RAP_getInstance() : (118.0 <= bpm ? bpm <= 136.0 : false) && $this.ia_1 >= 1.8 && $this.ga_1 < 0.2 ? Genre_EDM_getInstance() : Genre_STANDARD_getInstance();
}
function commit($this, g, now, why) {
  if (g.equals($this.k9_1))
    return Unit_instance;
  $this.l9_1 = $this.k9_1;
  $this.k9_1 = g;
  $this.m9_1 = now;
  $this.ea_1 = g;
  $this.fa_1 = now;
  $this.n9_1 = now;
  $this.s9_1 = why;
  if (g.equals(Genre_HARDSTYLE_getInstance()) && !(why === 'valgt'))
    $this.oa_1 = true;
  RaveLog_getInstance().ra('RaveGenre', fmt('\u2192 ' + g.c9_1 + ' (' + why + ') apple=' + $this.ba_1 + ' grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f', [$this.ga_1, $this.ha_1, $this.ia_1, $this.ja_1]));
}
function update$avg(decay, old, v) {
  return old * decay + v * (1.0 - decay);
}
function GenreDetector() {
  this.k9_1 = Genre_HARDSTYLE_getInstance();
  this.l9_1 = Genre_HARDSTYLE_getInstance();
  this.m9_1 = new Long(0, 0);
  this.n9_1 = new Long(0, 0);
  this.o9_1 = false;
  this.p9_1 = null;
  this.q9_1 = null;
  this.r9_1 = false;
  this.s9_1 = '';
  this.t9_1 = 0.0;
  this.u9_1 = 0.0;
  this.v9_1 = 0.0;
  this.w9_1 = 0.0;
  this.x9_1 = new Float32Array(get_entries().q());
  this.y9_1 = null;
  this.z9_1 = null;
  this.aa_1 = null;
  this.ba_1 = null;
  this.ca_1 = new Long(0, 0);
  this.da_1 = new Long(0, 0);
  this.ea_1 = Genre_HARDSTYLE_getInstance();
  this.fa_1 = new Long(0, 0);
  this.ga_1 = 0.0;
  this.ha_1 = 0.0;
  this.ia_1 = 0.0;
  this.ja_1 = 0.0;
  this.ka_1 = 0.0;
  this.la_1 = 0.0;
  this.ma_1 = new Long(0, 0);
  this.na_1 = new Long(0, 0);
  this.oa_1 = false;
  this.pa_1 = 0.1;
}
protoOf(GenreDetector).sa = function () {
  return this.oa_1 && this.q9_1 == null;
};
protoOf(GenreDetector).ta = function (now) {
  this.p9_1 = null;
  this.ba_1 = null;
  this.ca_1 = now;
  this.o9_1 = false;
  this.oa_1 = false;
  this.q9_1 = null;
  this.r9_1 = false;
  this.na_1 = new Long(0, 0);
  fill_0(this.x9_1, 0.0);
  this.s9_1 = '';
  this.z9_1 = null;
  this.aa_1 = null;
  this.t9_1 = 0.0;
  this.u9_1 = 0.0;
  this.v9_1 = 0.0;
  this.w9_1 = 0.0;
  this.pa_1 = 0.1;
  if (!this.k9_1.equals(Genre_STANDARD_getInstance())) {
    this.l9_1 = this.k9_1;
    this.k9_1 = Genre_STANDARD_getInstance();
    this.m9_1 = now;
  }
  this.ea_1 = this.k9_1;
  this.fa_1 = now;
};
protoOf(GenreDetector).ua = function (appleGenre, appleExact, deezerGenres, chosen, now) {
  this.r9_1 = true;
  this.ba_1 = appleGenre;
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
  tmp.p9_1 = a == null ? d : a;
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
        tmp_1 = deezerGenres.n();
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
  if (!((chosen == null ? this.aa_1 : chosen) == null)) {
    tmp_2 = to(ensureNotNull(chosen == null ? this.aa_1 : chosen), 'du');
  } else {
    if (!(this.z9_1 == null)) {
      tmp_2 = to(ensureNotNull(this.z9_1), 'stil-l\xE6rer');
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
  var lock = _destruct__k2r9zo.d7();
  var why = _destruct__k2r9zo.e7();
  if (!(lock == null)) {
    this.q9_1 = lock;
    if (!equals(lock, Genre_HARDSTYLE_getInstance())) {
      this.oa_1 = false;
      this.na_1 = new Long(0, 0);
    }
    if (equals(lock, Genre_RAP_getInstance()) || get_CALM_LOCK().o(lock))
      this.pa_1 = 0.0;
    if (this.y9_1 == null) {
      commit(this, lock, now, why);
      announce(this, now);
    }
    this.s9_1 = why;
    return Unit_instance;
  }
  var tmp4_elvis_lhs = this.p9_1;
  var tmp_3;
  if (tmp4_elvis_lhs == null) {
    return Unit_instance;
  } else {
    tmp_3 = tmp4_elvis_lhs;
  }
  var g = tmp_3;
  var src = !(a == null) ? 'Apple: ' + appleGenre : 'Deezer: ' + deezerName;
  if (this.y9_1 == null && !g.equals(Genre_EDM_getInstance())) {
    commit(this, g, now, src);
    announce(this, now);
    this.s9_1 = src;
  }
};
protoOf(GenreDetector).va = function (f, now) {
  var tmp;
  if (equalsLong(this.da_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.da_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.da_1 = now;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / 8.0;
  var decay = Math.exp(x);
  this.ga_1 = update$avg(decay, this.ga_1, f.c8_1);
  this.ha_1 = update$avg(decay, this.ha_1, f.g8_1);
  var kickHit = f.u7_1 > 0.95 && this.ka_1 <= 0.95 ? 1.0 : 0.0;
  var snareHit = f.e8_1 > 0.95 && this.la_1 <= 0.95 ? 1.0 : 0.0;
  this.ka_1 = f.u7_1;
  this.la_1 = f.e8_1;
  this.ia_1 = this.ia_1 * decay + kickHit / 8.0;
  this.ja_1 = this.ja_1 * decay + snareHit / 8.0;
  updateRockness(this, f, dt);
  var _array__4zh2yp = this.x9_1;
  var _index_0__fvwizt = this.k9_1.y_1;
  _array__4zh2yp[_index_0__fvwizt] = _array__4zh2yp[_index_0__fvwizt] + dt;
  if (f.w7_1 > 0.05)
    this.w9_1 = this.w9_1 + dt;
  var tmp_0 = this;
  var tmp_1 = this.u9_1;
  var tmp_2 = f.w7_1 - this.u9_1;
  // Inline function 'kotlin.math.exp' call
  var x_0 = -dt / 1.5;
  tmp_0.u9_1 = tmp_1 + tmp_2 * (1.0 - Math.exp(x_0));
  var tmp_3 = this;
  var tmp_4 = this.v9_1;
  var tmp_5 = f.w7_1 - this.v9_1;
  // Inline function 'kotlin.math.exp' call
  var x_1 = -dt / (this.w9_1 < 10.0 ? 1.5 : 40.0);
  tmp_3.v9_1 = tmp_4 + tmp_5 * (1.0 - Math.exp(x_1));
  var lift = this.w9_1 < 10.0 ? 0.0 : coerceIn((this.u9_1 - this.v9_1 - 0.015) / 0.07, 0.0, 1.0);
  var tmp_6 = this;
  var tmp_7 = this.t9_1;
  var tmp_8 = lift - this.t9_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 0.8;
  tmp_6.t9_1 = tmp_7 + tmp_8 * (1.0 - Math.exp(x_2));
  if (compare(subtract(now, this.ma_1), new Long(5000, 0)) >= 0) {
    this.ma_1 = now;
    RaveLog_getInstance().ra('RaveGenre', fmt('n\xE5=' + this.k9_1.c9_1 + ' apple=' + this.ba_1 + ' bpm=%.0f grit=%.2f sub=%.2f kick/s=%.2f snare/s=%.2f rock=%.2f refreng=%.2f \u2192 lyd sier ' + audioGuess(this, f.d8_1).c9_1, [f.d8_1, this.ga_1, this.ha_1, this.ia_1, this.ja_1, this.pa_1, this.t9_1]));
  }
  var tmp0_safe_receiver = this.y9_1;
  if (tmp0_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    if (!tmp0_safe_receiver.equals(this.k9_1)) {
      commit(this, tmp0_safe_receiver, now, 'valgt');
    }
    return this.k9_1;
  }
  var tmp1_safe_receiver = this.q9_1;
  if (tmp1_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    if (!tmp1_safe_receiver.equals(this.k9_1)) {
      // Inline function 'kotlin.text.ifBlank' call
      var this_1 = this.s9_1;
      var tmp_9;
      if (isBlank(this_1)) {
        tmp_9 = 'l\xE5st';
      } else {
        tmp_9 = this_1;
      }
      var tmp$ret$9 = tmp_9;
      commit(this, tmp1_safe_receiver, now, tmp$ret$9);
    }
    return this.k9_1;
  }
  var metaKnown = this.r9_1 || compare(subtract(now, this.ca_1), new Long(4000, 0)) >= 0;
  if (!equals(this.p9_1, Genre_ROCK_getInstance()) && f.b8_1 > 0.45 && f.c8_1 > 0.3) {
    if (equalsLong(this.na_1, new Long(0, 0)))
      this.na_1 = now;
  } else if (f.b8_1 < 0.2)
    this.na_1 = new Long(0, 0);
  if (compare(this.na_1, new Long(0, 0)) > 0 && compare(subtract(now, this.na_1), new Long(800, 0)) >= 0 && !this.k9_1.equals(Genre_HARDSTYLE_getInstance()) && metaKnown) {
    commit(this, Genre_HARDSTYLE_getInstance(), now, 'r\xE5tt drop');
  }
  if ((this.p9_1 == null || equals(this.p9_1, Genre_EDM_getInstance())) && compare(subtract(now, this.ca_1), new Long(8000, 0)) < 0)
    return this.k9_1;
  if (!this.o9_1) {
    announce(this, now);
  }
  var audio = audioGuess(this, f.d8_1);
  var calm = f.w7_1 < 0.2;
  var containsArg = f.d8_1;
  var hardstyleTempo = 138.0 <= containsArg ? containsArg <= 250.0 : false;
  var obviousHardstyle = hardstyleTempo && this.ia_1 > 2.2;
  var target = this.oa_1 ? Genre_HARDSTYLE_getInstance() : obviousHardstyle && !equals(this.p9_1, Genre_ROCK_getInstance()) && !(contains_0(get_CALM_LOCK(), this.p9_1) || equals(this.p9_1, Genre_RAP_getInstance())) ? Genre_HARDSTYLE_getInstance() : obviousHardstyle && this.ga_1 > 0.12 ? Genre_HARDSTYLE_getInstance() : equals(this.p9_1, Genre_EDM_getInstance()) && hardstyleTempo ? Genre_HARDSTYLE_getInstance() : equals(this.p9_1, Genre_EDM_getInstance()) && this.ga_1 > 0.25 ? Genre_HARDSTYLE_getInstance() : compare(this.na_1, new Long(0, 0)) > 0 ? Genre_HARDSTYLE_getInstance() : calm ? Genre_STANDARD_getInstance() : audio.equals(Genre_HARDSTYLE_getInstance()) ? Genre_HARDSTYLE_getInstance() : !(this.p9_1 == null) ? ensureNotNull(this.p9_1) : audio;
  if (target.equals(Genre_HARDSTYLE_getInstance()) && this.k9_1.equals(Genre_HARDSTYLE_getInstance()) && compare(this.m9_1, this.ca_1) >= 0)
    this.oa_1 = true;
  if (!target.equals(this.ea_1)) {
    this.ea_1 = target;
    this.fa_1 = now;
  }
  var needed = this.k9_1.equals(Genre_STANDARD_getInstance()) && !calm ? new Long(1500, 0) : this.ea_1.equals(Genre_HARDSTYLE_getInstance()) && this.ga_1 > 0.3 ? new Long(2000, 0) : this.ea_1.equals(Genre_STANDARD_getInstance()) ? new Long(5000, 0) : new Long(6000, 0);
  if (!this.ea_1.equals(this.k9_1) && compare(subtract(now, this.fa_1), needed) >= 0) {
    commit(this, this.ea_1, now, calm ? 'rolig del' : 'lyd');
  }
  return this.k9_1;
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
  this.ya_1 = label;
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
  this.bb_1 = label;
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
  this.cb_1 = part;
  this.db_1 = barInPhrase;
  this.eb_1 = phrase;
  this.fb_1 = ready;
  this.gb_1 = subRelDb;
  this.hb_1 = airTrendDb;
  this.ib_1 = build;
  this.jb_1 = grit;
  this.kb_1 = screech;
  this.lb_1 = vocalHint;
  this.mb_1 = bpm;
}
protoOf(StructureHud).toString = function () {
  return 'StructureHud(part=' + this.cb_1 + ', barInPhrase=' + this.db_1 + ', phrase=' + this.eb_1 + ', ready=' + this.fb_1 + ', subRelDb=' + this.gb_1 + ', airTrendDb=' + this.hb_1 + ', build=' + this.ib_1 + ', grit=' + this.jb_1 + ', screech=' + this.kb_1 + ', vocalHint=' + this.lb_1 + ', bpm=' + this.mb_1 + ')';
};
protoOf(StructureHud).hashCode = function () {
  var result = getStringHashCode(this.cb_1);
  result = imul_0(result, 31) + this.db_1 | 0;
  result = imul_0(result, 31) + this.eb_1 | 0;
  result = imul_0(result, 31) + getBooleanHashCode(this.fb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.gb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.hb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ib_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.jb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.kb_1) | 0;
  result = imul_0(result, 31) + getBooleanHashCode(this.lb_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.mb_1) | 0;
  return result;
};
protoOf(StructureHud).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof StructureHud))
    return false;
  if (!(this.cb_1 === other.cb_1))
    return false;
  if (!(this.db_1 === other.db_1))
    return false;
  if (!(this.eb_1 === other.eb_1))
    return false;
  if (!(this.fb_1 === other.fb_1))
    return false;
  if (!equals(this.gb_1, other.gb_1))
    return false;
  if (!equals(this.hb_1, other.hb_1))
    return false;
  if (!equals(this.ib_1, other.ib_1))
    return false;
  if (!equals(this.jb_1, other.jb_1))
    return false;
  if (!equals(this.kb_1, other.kb_1))
    return false;
  if (!(this.lb_1 === other.lb_1))
    return false;
  if (!equals(this.mb_1, other.mb_1))
    return false;
  return true;
};
function PartyTuning() {
  PartyTuning_instance = this;
  this.nb_1 = -2.5;
  this.ob_1 = 2.0;
  this.pb_1 = -3.0;
  this.qb_1 = -1.5;
  this.rb_1 = -4.0;
  this.sb_1 = 2.0;
  this.tb_1 = -99.0;
  this.ub_1 = 0.02;
  this.vb_1 = -0.04;
  this.wb_1 = false;
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
  if (!always && (text === $this.zb_1 || compare(subtract(now, $this.fe_1), new Long(6000, 0)) < 0))
    return Unit_instance;
  $this.zb_1 = text;
  $this.ac_1 = now;
  $this.fe_1 = now;
}
function enter($this, next, now, why) {
  if (next.equals($this.xb_1))
    return Unit_instance;
  RaveLog_getInstance().ra('RaveGenre', 'del: ' + $this.xb_1.ya_1 + ' \u2192 ' + next.ya_1 + ' (' + why + ')');
  if ($this.xb_1.equals(SongPart_DROP_getInstance()))
    $this.pd_1 = now;
  if (next.equals(SongPart_DROP_getInstance())) {
    $this.jd_1 = new Long(0, 0);
    $this.qd_1 = new Long(0, 0);
  }
  $this.xb_1 = next;
  $this.ec_1 = now;
  switch (next.y_1) {
    case 3:
      $this.td_1 = true;
      $this.ud_1 = true;
      show($this, 'BUILD-UP', now);
      break;
    case 2:
      $this.td_1 = true;
      $this.ud_1 = true;
      show($this, 'BREAKDOWN', now);
      break;
    case 1:
      $this.td_1 = true;
      $this.ud_1 = true;
      show($this, 'BREAKDOWN (SYNG?)', now);
      break;
    case 7:
      $this.td_1 = true;
      $this.ud_1 = true;
      show($this, 'ANTI-CLIMAX', now);
      break;
    default:
      break;
  }
}
function voteBoundary($this, beat) {
  var _array__4zh2yp = $this.ge_1;
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
  this.xb_1 = SongPart_INTRO_getInstance();
  this.yb_1 = DropKind_NONE_getInstance();
  this.zb_1 = '';
  this.ac_1 = new Long(0, 0);
  this.bc_1 = new StructureHud();
  this.cc_1 = new Long(0, 0);
  this.dc_1 = new Long(0, 0);
  this.ec_1 = new Long(0, 0);
  this.fc_1 = 0.0;
  this.gc_1 = 0.0;
  this.hc_1 = 0.0;
  this.ic_1 = 0.0;
  this.jc_1 = 0.0;
  this.kc_1 = 0.0;
  this.lc_1 = 0.0;
  this.mc_1 = 0.0;
  this.nc_1 = new Long(0, 0);
  this.oc_1 = new Long(0, 0);
  this.pc_1 = 0.0;
  this.qc_1 = 0.0;
  this.rc_1 = 0.0;
  this.sc_1 = 0.0;
  this.tc_1 = 0.0;
  this.uc_1 = new Long(0, 0);
  this.vc_1 = false;
  this.wc_1 = false;
  this.xc_1 = new Long(0, 0);
  this.yc_1 = true;
  this.zc_1 = false;
  this.ad_1 = false;
  this.bd_1 = 1600.0;
  this.cd_1 = -1.0;
  this.dd_1 = 0.0;
  this.ed_1 = 0.0;
  this.fd_1 = 0.0;
  this.gd_1 = 0.0;
  this.hd_1 = 0.0;
  this.id_1 = 0.0;
  this.jd_1 = new Long(0, 0);
  this.kd_1 = null;
  this.ld_1 = null;
  this.md_1 = 0.0;
  this.nd_1 = new Long(0, 0);
  this.od_1 = 0.0;
  this.pd_1 = new Long(0, 0);
  this.qd_1 = new Long(0, 0);
  this.rd_1 = 0.0;
  this.sd_1 = 0.0;
  this.td_1 = false;
  this.ud_1 = false;
  this.vd_1 = new Long(0, 0);
  this.wd_1 = new Long(0, 0);
  this.xd_1 = new Long(0, 0);
  this.yd_1 = 0.0;
  this.zd_1 = 0.0;
  this.ae_1 = new Long(0, 0);
  this.be_1 = 0;
  this.ce_1 = false;
  this.de_1 = 0.0;
  this.ee_1 = 0.4;
  this.fe_1 = new Long(0, 0);
  this.ge_1 = new Int32Array(32);
  this.he_1 = -1;
}
protoOf(HardstyleStructure).ie = function () {
  return this.xb_1.equals(SongPart_DROP_getInstance()) && !this.yb_1.equals(DropKind_PENDING_getInstance());
};
protoOf(HardstyleStructure).je = function () {
  return this.be_1;
};
protoOf(HardstyleStructure).ta = function (now) {
  this.xb_1 = SongPart_INTRO_getInstance();
  this.yb_1 = DropKind_NONE_getInstance();
  this.zb_1 = '';
  this.ac_1 = new Long(0, 0);
  this.bc_1 = new StructureHud();
  this.dc_1 = now;
  this.ec_1 = now;
  this.vc_1 = false;
  this.wc_1 = false;
  this.xc_1 = new Long(0, 0);
  this.jd_1 = new Long(0, 0);
  this.qd_1 = new Long(0, 0);
  this.rd_1 = 0.0;
  this.sd_1 = 0.0;
  this.pd_1 = new Long(0, 0);
  this.ld_1 = null;
  this.md_1 = 0.0;
  this.od_1 = 0.0;
  this.nd_1 = new Long(0, 0);
  this.td_1 = false;
  this.ud_1 = false;
  this.vd_1 = new Long(0, 0);
  this.wd_1 = new Long(0, 0);
  this.xd_1 = new Long(0, 0);
  this.ae_1 = new Long(0, 0);
  this.be_1 = 0;
  this.ce_1 = false;
  this.de_1 = 0.0;
  this.ee_1 = 0.4;
  this.fe_1 = new Long(0, 0);
  fill(this.ge_1, 0);
  this.he_1 = -1;
  this.uc_1 = new Long(0, 0);
  this.rc_1 = 0.0;
  this.kc_1 = 0.0;
  this.lc_1 = 0.0;
  this.mc_1 = 0.0;
  this.nc_1 = new Long(0, 0);
  this.oc_1 = new Long(0, 0);
};
protoOf(HardstyleStructure).ke = function (f, now, positionMs, durationMs) {
  var tmp;
  if (equalsLong(this.cc_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.cc_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.cc_1 = now;
  if (equalsLong(this.dc_1, new Long(0, 0))) {
    this.dc_1 = now;
    this.ec_1 = now;
  }
  var subDb = db(this, f.l8_1);
  var airDb = db(this, f.k8_1);
  if (!this.vc_1) {
    this.fc_1 = subDb;
    this.gc_1 = subDb;
    this.hc_1 = subDb;
    this.ic_1 = airDb;
    this.jc_1 = airDb;
    this.pc_1 = subDb;
    this.qc_1 = subDb;
    this.lc_1 = f.r8_1;
    this.mc_1 = f.r8_1;
    this.vc_1 = true;
    this.dd_1 = subDb;
    this.ed_1 = airDb;
    this.fd_1 = db(this, f.m8_1);
    this.gd_1 = this.dd_1;
    this.hd_1 = this.ed_1;
    this.id_1 = this.fd_1;
  }
  if (!this.wc_1 && compare(subtract(now, this.dc_1), new Long(1500, 0)) >= 0 && compare(positionMs, new Long(0, 0)) >= 0) {
    this.wc_1 = true;
    if (compare(subtract(positionMs, subtract(now, this.dc_1)), new Long(30000, 0)) > 0) {
      this.ud_1 = true;
      this.td_1 = true;
    }
  }
  this.fc_1 = update$ema(dt, this.fc_1, subDb, 0.25);
  this.gc_1 = update$ema(dt, this.gc_1, subDb, 1.0);
  this.hc_1 = update$ema(dt, this.hc_1, subDb, 8.0);
  var tmp_0 = this;
  var tmp0 = this.gc_1;
  // Inline function 'kotlin.math.max' call
  var b = this.pc_1 - dt * (6.0 / 25.0);
  tmp_0.pc_1 = Math.max(tmp0, b);
  var tmp_1 = this;
  var tmp0_0 = this.gc_1;
  // Inline function 'kotlin.comparisons.minOf' call
  var b_0 = this.qc_1 + dt * 1.5;
  tmp_1.qc_1 = Math.min(tmp0_0, b_0);
  this.ic_1 = update$ema(dt, this.ic_1, airDb, 1.0);
  this.jc_1 = update$ema(dt, this.jc_1, airDb, 8.0);
  this.kc_1 = update$ema(dt, this.kc_1, f.c8_1, 1.0);
  this.dd_1 = update$ema(dt, this.dd_1, subDb, 2.0);
  this.ed_1 = update$ema(dt, this.ed_1, airDb, 2.0);
  this.fd_1 = update$ema(dt, this.fd_1, db(this, f.m8_1), 2.0);
  var fall = dt * 0.05;
  var tmp_2 = this;
  var tmp0_1 = this.dd_1;
  // Inline function 'kotlin.math.max' call
  var b_1 = this.gd_1 - fall;
  tmp_2.gd_1 = Math.max(tmp0_1, b_1);
  var tmp_3 = this;
  var tmp0_2 = this.ed_1;
  // Inline function 'kotlin.math.max' call
  var b_2 = this.hd_1 - fall;
  tmp_3.hd_1 = Math.max(tmp0_2, b_2);
  var tmp_4 = this;
  var tmp0_3 = this.fd_1;
  // Inline function 'kotlin.math.max' call
  var b_3 = this.id_1 - fall;
  tmp_4.id_1 = Math.max(tmp0_3, b_3);
  this.rd_1 = (this.ed_1 - this.hd_1 + (this.fd_1 - this.id_1)) / 2.0;
  this.sd_1 = this.dd_1 - this.gd_1;
  var warmedUp = compare(subtract(now, this.dc_1), new Long(20000, 0)) > 0;
  var print = this.kd_1;
  if (!(print == null) && PartyTuning_getInstance().wb_1 && f.z7_1.q() === print.length) {
    var tmp0_elvis_lhs = this.ld_1;
    var tmp_5;
    if (tmp0_elvis_lhs == null) {
      // Inline function 'kotlin.also' call
      var this_1 = new Float32Array(print.length);
      this.ld_1 = this_1;
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
        e[i] = e[i] + (f.z7_1.m(i) - e[i]) * a;
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
    if (this.md_1 === 0.0) {
      tmp_9 = like;
    } else {
      var tmp_10 = this.md_1;
      var tmp_11 = like - this.md_1;
      // Inline function 'kotlin.math.exp' call
      var x_1 = -dt / 30.0;
      tmp_9 = tmp_10 + tmp_11 * (1.0 - Math.exp(x_1));
    }
    tmp_8.md_1 = tmp_9;
    this.od_1 = like - this.md_1;
  }
  var printOk = !(print == null) && PartyTuning_getInstance().wb_1 && warmedUp;
  this.lc_1 = update$ema(dt, this.lc_1, f.r8_1, 1.0);
  this.mc_1 = update$ema(dt, this.mc_1, f.r8_1, 8.0);
  var kickHit = f.u7_1 > 0.95 && this.tc_1 <= 0.95;
  var snareHit = f.e8_1 > 0.95 && this.sc_1 <= 0.95;
  this.tc_1 = f.u7_1;
  this.sc_1 = f.e8_1;
  if (kickHit)
    this.uc_1 = now;
  var tmp_12 = this;
  var tmp_13 = this.rc_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 2.0;
  tmp_12.rc_1 = tmp_13 * Math.exp(x_2) + (snareHit ? 1.0 : 0.0) / 2.0;
  var tmp_14;
  var containsArg = f.d8_1;
  if (100.0 <= containsArg ? containsArg <= 260.0 : false) {
    tmp_14 = 240000.0 / f.d8_1;
  } else {
    tmp_14 = 1600.0;
  }
  var barMs = tmp_14;
  this.bd_1 = barMs;
  var forced = this.zc_1 || compare(now, this.xc_1) < 0;
  this.ad_1 = (!this.zc_1 && compare(now, this.xc_1) < 0);
  var subRel = this.gc_1 - this.hc_1;
  var subHitRel = this.fc_1 - this.hc_1;
  var airTrend = this.ic_1 - this.jc_1;
  var songFraction = compare(durationMs, new Long(0, 0)) > 0 && compare(positionMs, new Long(0, 0)) >= 0 ? toNumber(positionMs) / toNumber(durationMs) : -1.0;
  this.cd_1 = songFraction;
  var remainingMs = compare(durationMs, new Long(0, 0)) > 0 && compare(positionMs, new Long(0, 0)) >= 0 ? subtract(durationMs, positionMs) : new Long(-1, -1);
  var kickGone = equalsLong(this.uc_1, new Long(0, 0)) || toNumber(subtract(now, this.uc_1)) > barMs;
  if (!this.ud_1 && toNumber(subtract(now, this.dc_1)) > 32 * barMs)
    this.ud_1 = true;
  var riser = airTrend > 0.0 ? coerceIn((this.lc_1 - this.mc_1) / 0.12, 0.0, 1.0) : 0.0;
  var build = 0.4 * coerceIn(-subRel / 6.0, 0.0, 1.0) + 0.25 * coerceIn(airTrend / 4.0, 0.0, 1.0) + 0.15 * coerceIn((this.rc_1 - 1.0) / 3.0, 0.0, 1.0) + 0.2 * riser;
  var buildEvidence = build >= 0.55 && subRel < -3.0 && (airTrend > 1.5 || this.rc_1 > 2.0 || riser > 0.5);
  if (buildEvidence) {
    if (equalsLong(this.vd_1, new Long(0, 0)))
      this.vd_1 = now;
    this.wd_1 = new Long(0, 0);
  } else {
    if (equalsLong(this.wd_1, new Long(0, 0)))
      this.wd_1 = now;
    if (compare(subtract(now, this.wd_1), new Long(1000, 0)) > 0)
      this.vd_1 = new Long(0, 0);
  }
  if (this.xb_1.y_1 === 4) {
    if (!forced && this.yb_1.equals(DropKind_PENDING_getInstance()) && toNumber(subtract(now, this.xd_1)) >= barMs) {
      var atLoudLevel = this.gc_1 >= this.pc_1 - 3.0 && !kickGone && this.gc_1 - this.yd_1 >= 1.5;
      var fullEnough = !warmedUp || (this.rd_1 >= PartyTuning_getInstance().rb_1 && this.sd_1 >= PartyTuning_getInstance().tb_1);
      if (!fullEnough) {
        this.yb_1 = DropKind_NONE_getInstance();
        this.qc_1 = this.gc_1;
        RaveLog_getInstance().ra('RaveGenre', fmt('ikke drop: diskant/vokal %.1f dB under toppen', [-this.rd_1]));
        enter(this, SongPart_BREAKDOWN_getInstance(), now, 'ikke fullt nok for drop');
      } else if (this.gc_1 - this.yd_1 >= 3.0 || atLoudLevel || (printOk && !kickGone && this.od_1 >= PartyTuning_getInstance().ub_1)) {
        this.be_1 = this.be_1 + 1 | 0;
        this.nc_1 = this.xd_1;
        this.td_1 = false;
        this.de_1 = this.ce_1 ? 0.1 : 0.0;
        this.ce_1 = false;
        this.yb_1 = songFraction >= 0.6 ? DropKind_LAST_getInstance() : this.be_1 === 1 ? DropKind_FIRST_getInstance() : DropKind_MIDDLE_getInstance();
        show(this, this.yb_1.bb_1, now, true);
        RaveLog_getInstance().ra('RaveGenre', fmt('ekte drop #' + this.be_1 + ' \u2192 ' + this.yb_1.bb_1 + ' (%.0f%% ut, sub +%.1f dB)', [songFraction * 100.0, this.gc_1 - this.yd_1]));
      } else {
        this.ce_1 = true;
        this.yb_1 = DropKind_NONE_getInstance();
        if (f.i8_1 > 0.35 && this.kc_1 > 0.25) {
          RaveLog_getInstance().ra('RaveGenre', fmt('ANTI-CLIMAX (sub bare +%.1f dB, screech %.2f)', [this.gc_1 - this.yd_1, f.i8_1]));
          enter(this, SongPart_ANTI_CLIMAX_getInstance(), now, 'anti-climax');
        } else {
          show(this, 'FAKE DROP', now, compare(subtract(now, this.oc_1), new Long(8000, 0)) > 0);
          RaveLog_getInstance().ra('RaveGenre', fmt('FAKE DROP (sub bare +%.1f dB etter 1 takt)', [this.gc_1 - this.yd_1]));
          enter(this, kickGone ? SongPart_BREAKDOWN_getInstance() : SongPart_BUILDUP_getInstance(), now, 'fake drop');
        }
        this.oc_1 = now;
        this.qc_1 = this.gc_1;
        this.td_1 = true;
      }
    }
    if (!forced && this.xb_1.equals(SongPart_DROP_getInstance()) && !this.yb_1.equals(DropKind_PENDING_getInstance())) {
      if (this.gc_1 < this.zd_1 - 6.0 || kickGone) {
        if (equalsLong(this.ae_1, new Long(0, 0)))
          this.ae_1 = now;
      } else
        this.ae_1 = new Long(0, 0);
      if (compare(this.ae_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.ae_1)) >= barMs) {
        this.yb_1 = DropKind_NONE_getInstance();
        this.de_1 = 0.0;
        this.ae_1 = new Long(0, 0);
        enter(this, kickGone ? SongPart_BREAKDOWN_getInstance() : compare(this.vd_1, new Long(0, 0)) > 0 ? SongPart_BUILDUP_getInstance() : SongPart_GROOVE_getInstance(), now, 'bassen borte i 1 takt');
      } else if (compare(this.vd_1, new Long(0, 0)) > 0 && compare(subtract(now, this.vd_1), new Long(2000, 0)) >= 0) {
        this.yb_1 = DropKind_NONE_getInstance();
        this.de_1 = 0.0;
        this.ae_1 = new Long(0, 0);
        enter(this, SongPart_BUILDUP_getInstance(), now, 'build-up inni dropet');
      } else if (warmedUp) {
        var buildSig = this.sd_1 < PartyTuning_getInstance().pb_1 && this.rd_1 > PartyTuning_getInstance().qb_1;
        var unlike = printOk && PartyTuning_getInstance().vb_1 < 0.0 && this.od_1 < PartyTuning_getInstance().vb_1;
        var dull = this.rd_1 < PartyTuning_getInstance().nb_1 || unlike;
        this.qd_1 = buildSig ? equalsLong(this.qd_1, new Long(0, 0)) ? now : this.qd_1 : new Long(0, 0);
        this.jd_1 = dull ? equalsLong(this.jd_1, new Long(0, 0)) ? now : this.jd_1 : new Long(0, 0);
        if (compare(this.qd_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.qd_1)) >= barMs) {
          this.yb_1 = DropKind_NONE_getInstance();
          this.de_1 = 0.0;
          this.qd_1 = new Long(0, 0);
          this.jd_1 = new Long(0, 0);
          enter(this, SongPart_BUILDUP_getInstance(), now, 'lite sub, full diskant');
        } else if (compare(this.jd_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.jd_1)) >= PartyTuning_getInstance().ob_1 * barMs) {
          this.yb_1 = DropKind_NONE_getInstance();
          this.de_1 = 0.0;
          this.qd_1 = new Long(0, 0);
          this.jd_1 = new Long(0, 0);
          enter(this, SongPart_BREAKDOWN_getInstance(), now, fmt('diskant/vokal ned %.1f dB', [this.rd_1]));
        }
      }
    }
  } else {
    var tmp_15;
    if (compare(this.nc_1, new Long(0, 0)) > 0) {
      var tmp_16 = subtract(now, this.nc_1);
      var tmp0_4 = new Long(16000, 0);
      // Inline function 'kotlin.comparisons.minOf' call
      var b_4 = numberToLong(8 * barMs);
      var tmp$ret$12 = compare(tmp0_4, b_4) <= 0 ? tmp0_4 : b_4;
      tmp_15 = compare(tmp_16, tmp$ret$12) < 0;
    } else {
      tmp_15 = false;
    }
    var lockedOut = tmp_15;
    var afterFake = compare(this.oc_1, new Long(0, 0)) > 0 && compare(subtract(now, this.oc_1), numberToLong(2 * barMs)) < 0;
    var unprepared = !this.td_1 && (this.xb_1.equals(SongPart_INTRO_getInstance()) || this.xb_1.equals(SongPart_GROOVE_getInstance()) || this.xb_1.equals(SongPart_BREAKDOWN_getInstance()));
    var introDropOk = unprepared && toNumber(subtract(now, this.dc_1)) > 16 * barMs;
    var blockedByCorrection = this.zc_1 || (forced && !this.yc_1) || (compare(this.pd_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.pd_1)) < PartyTuning_getInstance().sb_1 * barMs);
    var mayDrop = !lockedOut && !afterFake && !blockedByCorrection && (this.td_1 || introDropOk || this.xb_1.equals(SongPart_BUILDUP_getInstance()) || this.xb_1.equals(SongPart_BREAKDOWN_getInstance()) || this.xb_1.equals(SongPart_VOCAL_getInstance()) || this.xb_1.equals(SongPart_ANTI_CLIMAX_getInstance()));
    var backFromDip = this.fc_1 - this.qc_1 >= 6.0 && this.fc_1 >= this.pc_1 - 3.0;
    var hit = unprepared ? backFromDip : subHitRel >= 6.0 || backFromDip;
    if (mayDrop && hit && f.l8_1 > 8.0 && compare(subtract(now, this.uc_1), new Long(300, 0)) < 0) {
      this.xd_1 = now;
      var tmp_17 = this;
      var tmp0_5 = this.hc_1;
      // Inline function 'kotlin.comparisons.minOf' call
      var b_5 = this.qc_1 + 3.0;
      tmp_17.yd_1 = Math.min(tmp0_5, b_5);
      this.zd_1 = this.fc_1;
      this.yb_1 = DropKind_PENDING_getInstance();
      this.ud_1 = true;
      this.xc_1 = new Long(0, 0);
      voteBoundary(this, f.n8_1);
      enter(this, SongPart_DROP_getInstance(), now, fmt('sub +%.1f dB', [subHitRel]));
    } else {
      var next = (compare(new Long(0, 0), remainingMs) <= 0 ? compare(remainingMs, numberToLong(16 * barMs)) <= 0 : false) && compare(subtract(now, this.dc_1), new Long(30000, 0)) > 0 ? SongPart_OUTRO_getInstance() : compare(this.vd_1, new Long(0, 0)) > 0 && compare(subtract(now, this.vd_1), new Long(2000, 0)) >= 0 ? SongPart_BUILDUP_getInstance() : this.xb_1.equals(SongPart_BUILDUP_getInstance()) && compare(this.vd_1, new Long(0, 0)) > 0 ? SongPart_BUILDUP_getInstance() : this.td_1 && (this.xb_1.equals(SongPart_BUILDUP_getInstance()) || this.xb_1.equals(SongPart_BREAKDOWN_getInstance()) || this.xb_1.equals(SongPart_ANTI_CLIMAX_getInstance())) && f.i8_1 > 0.35 && subRel < -2.0 && !kickGone && this.kc_1 > 0.25 ? SongPart_ANTI_CLIMAX_getInstance() : kickGone && !this.xb_1.equals(SongPart_INTRO_getInstance()) ? f.m8_1 > 3.0 && f.v7_1 > 0.08 ? SongPart_VOCAL_getInstance() : SongPart_BREAKDOWN_getInstance() : kickGone && this.xb_1.equals(SongPart_INTRO_getInstance()) && compare(subtract(now, this.dc_1), new Long(8000, 0)) > 0 ? SongPart_BREAKDOWN_getInstance() : !this.ud_1 ? SongPart_INTRO_getInstance() : SongPart_BREAKDOWN_getInstance();
      if (!forced && !next.equals(this.xb_1) && compare(subtract(now, this.ec_1), numberToLong(barMs)) >= 0) {
        enter(this, next, now, 'takt-bevis');
        if (next.equals(SongPart_BREAKDOWN_getInstance()) && !kickGone)
          this.td_1 = false;
      }
    }
  }
  var tmp0_6 = get_indices(this.ge_1);
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
    var maxValue = this.ge_1[it];
    do {
      var e_0 = iterator.l();
      var v = this.ge_1[e_0];
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
  var pos = (((f.n8_1 - phase | 0) % 32 | 0) + 32 | 0) % 32 | 0;
  var barInPhrase = (pos / 4 | 0) + 1 | 0;
  // Inline function 'kotlin.floorDiv' call
  var this_2 = f.n8_1 - phase | 0;
  var q = this_2 / 32 | 0;
  if ((this_2 ^ 32) < 0 && !(imul_0(q, 32) === this_2)) {
    q = q - 1 | 0;
  }
  var phrase = q + 1 | 0;
  var tmp_18;
  switch (this.xb_1.y_1) {
    case 4:
      var tmp_19;
      if (this.yb_1.equals(DropKind_PENDING_getInstance())) {
        tmp_19 = 'DROP?';
      } else {
        // Inline function 'kotlin.text.ifBlank' call
        var this_3 = this.yb_1.bb_1;
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

      tmp_18 = this.xb_1.ya_1.toUpperCase();
      break;
  }
  var partName = tmp_18;
  this.bc_1 = new StructureHud(partName, barInPhrase, phrase, this.td_1, subRel, airTrend, build, this.kc_1, f.i8_1, this.xb_1.equals(SongPart_VOCAL_getInstance()), f.d8_1);
  var bar = f.n8_1 / 4 | 0;
  if (!(bar === this.he_1)) {
    this.he_1 = bar;
    RaveLog_getInstance().ra('RaveGenre', fmt('takt %d/8 frase %d | %s | sub %+.1f dB (treff %+.1f) diskant %+.1f dB build %.0f%% grit %.2f snare/s %.1f klar=%b', [barInPhrase, phrase, partName, subRel, subHitRel, airTrend, build * 100.0, this.kc_1, this.rc_1, this.td_1]));
  }
  var boost = this.de_1;
  var tmp_21;
  switch (this.xb_1.y_1) {
    case 0:
      tmp_21 = 0.4;
      break;
    case 2:
    case 1:
      tmp_21 = 0.5;
      break;
    case 3:
      tmp_21 = coerceIn(0.55 + build * 0.25, 0.55, 0.8);
      break;
    case 4:
      var tmp_22;
      switch (this.yb_1.y_1) {
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
  var rate = target > this.ee_1 && this.xb_1.equals(SongPart_DROP_getInstance()) ? 0.05 : 0.6;
  var tmp_23 = this;
  var tmp_24 = this.ee_1;
  var tmp_25 = target - this.ee_1;
  // Inline function 'kotlin.math.exp' call
  var x_3 = -dt / rate;
  tmp_23.ee_1 = tmp_24 + tmp_25 * (1.0 - Math.exp(x_3));
  return this.ee_1;
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
  this.ne_1 = label;
  this.oe_1 = shake;
  this.pe_1 = strobe;
  this.qe_1 = spike;
  this.re_1 = particles;
  this.se_1 = screech;
}
function HardSubDetector() {
  this.te_1 = HardSub_RAW_getInstance();
  this.ue_1 = new Long(0, 0);
  this.ve_1 = new Float32Array(12);
  this.we_1 = 0;
  this.xe_1 = 0;
  this.ye_1 = new Long(0, 0);
  this.ze_1 = 0.0;
  this.af_1 = 0.0;
  this.bf_1 = 0.0;
  this.cf_1 = new Long(0, 0);
  this.df_1 = HardSub_RAW_getInstance();
  this.ef_1 = new Long(0, 0);
  this.ff_1 = false;
  this.gf_1 = null;
}
protoOf(HardSubDetector).hf = function () {
  this.we_1 = 0;
  this.xe_1 = 0;
  this.ze_1 = 0.0;
  this.af_1 = 0.0;
  this.ff_1 = false;
  this.gf_1 = null;
};
protoOf(HardSubDetector).va = function (f, now) {
  var tmp;
  if (equalsLong(this.cf_1, new Long(0, 0))) {
    tmp = 0.0;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.cf_1);
    var tmp$ret$0 = toNumber(this_0) / 1000.0;
    tmp = coerceIn(tmp$ret$0, 0.0, 0.2);
  }
  var dt = tmp;
  this.cf_1 = now;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / 8.0;
  var d = Math.exp(x);
  this.ze_1 = this.ze_1 * d + f.c8_1 * (1.0 - d);
  this.af_1 = this.af_1 * d + f.i8_1 * (1.0 - d);
  this.bf_1 = this.bf_1 * d + f.t8_1 * (1.0 - d);
  if (f.d8_1 > 0.0 && compare(subtract(now, this.ye_1), new Long(1000, 0)) >= 0) {
    this.ye_1 = now;
    this.ve_1[this.xe_1] = f.d8_1;
    this.xe_1 = (this.xe_1 + 1 | 0) % this.ve_1.length | 0;
    var tmp_0 = this;
    var tmp0 = this.we_1 + 1 | 0;
    // Inline function 'kotlin.comparisons.minOf' call
    var b = this.ve_1.length;
    tmp_0.we_1 = Math.min(tmp0, b);
  }
  if (!(this.gf_1 == null))
    return this.te_1;
  if (this.we_1 < 5)
    return this.te_1;
  var bpm = sorted(copyOf_1(this.ve_1, this.we_1)).m(this.we_1 / 2 | 0);
  var guess = bpm >= 222.0 ? HardSub_FRENCHCORE_getInstance() : bpm >= 188.0 ? HardSub_UPTEMPO_getInstance() : bpm >= 162.0 ? HardSub_HARDCORE_getInstance() : this.bf_1 > 0.5 && this.ze_1 < 0.35 ? HardSub_EUPHORIC_getInstance() : this.ze_1 > 0.22 || this.af_1 > 0.08 ? HardSub_RAW_getInstance() : HardSub_EUPHORIC_getInstance();
  if (!guess.equals(this.df_1)) {
    this.df_1 = guess;
    this.ef_1 = now;
  }
  var needed = this.ff_1 ? new Long(40000, 0) : new Long(12000, 0);
  if (!this.df_1.equals(this.te_1) && compare(subtract(now, this.ef_1), needed) >= 0 || (!this.ff_1 && this.df_1.equals(this.te_1) && compare(subtract(now, this.ef_1), new Long(12000, 0)) >= 0)) {
    this.ff_1 = true;
    if (this.df_1.equals(this.te_1))
      return this.te_1;
    this.te_1 = this.df_1;
    this.ue_1 = now;
    RaveLog_getInstance().ra('RaveGenre', fmt('undersjanger \u2192 ' + this.te_1.ne_1 + ' (bpm=%.0f grit=%.2f screech=%.2f)', [bpm, this.ze_1, this.af_1]));
  }
  return this.te_1;
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
  this.t7_1 = bass;
  this.u7_1 = kick;
  this.v7_1 = highs;
  this.w7_1 = energy;
  this.x7_1 = burst;
  this.y7_1 = build;
  this.z7_1 = spectrum;
  this.a8_1 = highMotion;
  this.b8_1 = heavy;
  this.c8_1 = grit;
  this.d8_1 = bpm;
  this.e8_1 = snare;
  this.f8_1 = crash;
  this.g8_1 = sub;
  this.h8_1 = level;
  this.i8_1 = screech;
  this.j8_1 = bassLevel;
  this.k8_1 = air;
  this.l8_1 = subLevel;
  this.m8_1 = presence;
  this.n8_1 = beat;
  this.o8_1 = beatAt;
  this.p8_1 = beatPeriod;
  this.q8_1 = beatConfidence;
  this.r8_1 = noise;
  this.s8_1 = centroid;
  this.t8_1 = offbeat;
  this.u8_1 = vocal;
  this.v8_1 = vocalHit;
}
protoOf(HardstyleFrame).if = function (bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit) {
  return new HardstyleFrame(bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit);
};
protoOf(HardstyleFrame).j9 = function (bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit, $super) {
  bass = bass === VOID ? this.t7_1 : bass;
  kick = kick === VOID ? this.u7_1 : kick;
  highs = highs === VOID ? this.v7_1 : highs;
  energy = energy === VOID ? this.w7_1 : energy;
  burst = burst === VOID ? this.x7_1 : burst;
  build = build === VOID ? this.y7_1 : build;
  spectrum = spectrum === VOID ? this.z7_1 : spectrum;
  highMotion = highMotion === VOID ? this.a8_1 : highMotion;
  heavy = heavy === VOID ? this.b8_1 : heavy;
  grit = grit === VOID ? this.c8_1 : grit;
  bpm = bpm === VOID ? this.d8_1 : bpm;
  snare = snare === VOID ? this.e8_1 : snare;
  crash = crash === VOID ? this.f8_1 : crash;
  sub = sub === VOID ? this.g8_1 : sub;
  level = level === VOID ? this.h8_1 : level;
  screech = screech === VOID ? this.i8_1 : screech;
  bassLevel = bassLevel === VOID ? this.j8_1 : bassLevel;
  air = air === VOID ? this.k8_1 : air;
  subLevel = subLevel === VOID ? this.l8_1 : subLevel;
  presence = presence === VOID ? this.m8_1 : presence;
  beat = beat === VOID ? this.n8_1 : beat;
  beatAt = beatAt === VOID ? this.o8_1 : beatAt;
  beatPeriod = beatPeriod === VOID ? this.p8_1 : beatPeriod;
  beatConfidence = beatConfidence === VOID ? this.q8_1 : beatConfidence;
  noise = noise === VOID ? this.r8_1 : noise;
  centroid = centroid === VOID ? this.s8_1 : centroid;
  offbeat = offbeat === VOID ? this.t8_1 : offbeat;
  vocal = vocal === VOID ? this.u8_1 : vocal;
  vocalHit = vocalHit === VOID ? this.v8_1 : vocalHit;
  return $super === VOID ? this.if(bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit) : $super.if.call(this, bass, kick, highs, energy, burst, build, spectrum, highMotion, heavy, grit, bpm, snare, crash, sub, level, screech, bassLevel, air, subLevel, presence, beat, beatAt, beatPeriod, beatConfidence, noise, centroid, offbeat, vocal, vocalHit);
};
protoOf(HardstyleFrame).toString = function () {
  return 'HardstyleFrame(bass=' + this.t7_1 + ', kick=' + this.u7_1 + ', highs=' + this.v7_1 + ', energy=' + this.w7_1 + ', burst=' + this.x7_1 + ', build=' + this.y7_1 + ', spectrum=' + toString_1(this.z7_1) + ', highMotion=' + this.a8_1 + ', heavy=' + this.b8_1 + ', grit=' + this.c8_1 + ', bpm=' + this.d8_1 + ', snare=' + this.e8_1 + ', crash=' + this.f8_1 + ', sub=' + this.g8_1 + ', level=' + this.h8_1 + ', screech=' + this.i8_1 + ', bassLevel=' + this.j8_1 + ', air=' + this.k8_1 + ', subLevel=' + this.l8_1 + ', presence=' + this.m8_1 + ', beat=' + this.n8_1 + ', beatAt=' + this.o8_1.toString() + ', beatPeriod=' + this.p8_1 + ', beatConfidence=' + this.q8_1 + ', noise=' + this.r8_1 + ', centroid=' + this.s8_1 + ', offbeat=' + this.t8_1 + ', vocal=' + this.u8_1 + ', vocalHit=' + this.v8_1 + ')';
};
protoOf(HardstyleFrame).hashCode = function () {
  var result = getNumberHashCode(this.t7_1);
  result = imul_0(result, 31) + getNumberHashCode(this.u7_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.v7_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.w7_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.x7_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.y7_1) | 0;
  result = imul_0(result, 31) + hashCode_0(this.z7_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.a8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.b8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.c8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.d8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.e8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.f8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.g8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.h8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.i8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.j8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.k8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.l8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.m8_1) | 0;
  result = imul_0(result, 31) + this.n8_1 | 0;
  result = imul_0(result, 31) + this.o8_1.hashCode() | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.p8_1) | 0;
  result = imul_0(result, 31) + this.q8_1 | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.r8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.s8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.t8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.u8_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.v8_1) | 0;
  return result;
};
protoOf(HardstyleFrame).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof HardstyleFrame))
    return false;
  if (!equals(this.t7_1, other.t7_1))
    return false;
  if (!equals(this.u7_1, other.u7_1))
    return false;
  if (!equals(this.v7_1, other.v7_1))
    return false;
  if (!equals(this.w7_1, other.w7_1))
    return false;
  if (!equals(this.x7_1, other.x7_1))
    return false;
  if (!equals(this.y7_1, other.y7_1))
    return false;
  if (!equals(this.z7_1, other.z7_1))
    return false;
  if (!equals(this.a8_1, other.a8_1))
    return false;
  if (!equals(this.b8_1, other.b8_1))
    return false;
  if (!equals(this.c8_1, other.c8_1))
    return false;
  if (!equals(this.d8_1, other.d8_1))
    return false;
  if (!equals(this.e8_1, other.e8_1))
    return false;
  if (!equals(this.f8_1, other.f8_1))
    return false;
  if (!equals(this.g8_1, other.g8_1))
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
  if (!(this.n8_1 === other.n8_1))
    return false;
  if (!equalsLong(this.o8_1, other.o8_1))
    return false;
  if (!equals(this.p8_1, other.p8_1))
    return false;
  if (!(this.q8_1 === other.q8_1))
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
  return true;
};
function accept$smooth(dt, old, target, seconds) {
  var tmp = target - old;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / seconds;
  return old + tmp * (1 - Math.exp(x));
}
function HardstyleAudio() {
  this.jf_1 = new HardstyleSpectrum();
  this.kf_1 = new DisplaySpectrum();
  this.lf_1 = 8.0;
  this.mf_1 = 0.0;
  this.nf_1 = 0.0;
  this.of_1 = new Long(0, 0);
  this.pf_1 = new Long(-1000, -1);
  this.qf_1 = new Long(-5000, -1);
  this.rf_1 = 0.0;
  this.sf_1 = 0.0;
  this.tf_1 = 0.0;
  this.uf_1 = 0.0;
  this.vf_1 = 0.0;
  this.wf_1 = new Long(-1000, -1);
  this.xf_1 = 0.0;
  this.yf_1 = 0.0;
  this.zf_1 = new Long(-1000, -1);
  this.ag_1 = 0.0;
  this.bg_1 = 0.0;
  this.cg_1 = 0.0;
  this.dg_1 = 0.0;
  this.eg_1 = 0.0;
  this.fg_1 = 0.0;
  this.gg_1 = new Long(-1000, -1);
  this.hg_1 = new BeatTracker();
  this.ig_1 = 0.0;
  this.jg_1 = new Long(-1000, -1);
  this.kg_1 = new HardstyleFrame();
}
protoOf(HardstyleAudio).lg = function (into) {
  var tmp0 = this.kf_1.f7_1;
  // Inline function 'kotlin.comparisons.minOf' call
  var a = into.length;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex = Math.min(a, 96);
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp, into, 0, 0, endIndex);
  return this.kf_1.g7_1;
};
protoOf(HardstyleAudio).n7 = function () {
  this.jf_1.n7();
  this.kf_1.n7();
  this.lf_1 = 8.0;
  this.mf_1 = 0.0;
  this.nf_1 = 0.0;
  this.of_1 = new Long(0, 0);
  this.pf_1 = new Long(-1000, -1);
  this.qf_1 = new Long(-5000, -1);
  this.rf_1 = 0.0;
  this.sf_1 = 0.0;
  this.tf_1 = 0.0;
  this.eg_1 = 0.0;
  this.fg_1 = 0.0;
  this.gg_1 = new Long(-1000, -1);
  this.uf_1 = 0.0;
  this.vf_1 = 0.0;
  this.wf_1 = new Long(-1000, -1);
  this.xf_1 = 0.0;
  this.yf_1 = 0.0;
  this.zf_1 = new Long(-1000, -1);
  this.ag_1 = 0.0;
  this.bg_1 = 0.0;
  this.cg_1 = 0.0;
  this.dg_1 = 0.0;
  this.hg_1.n7();
  this.ig_1 = 0.0;
  this.jg_1 = new Long(-1000, -1);
  this.kg_1 = new HardstyleFrame();
};
protoOf(HardstyleAudio).dh = function (fft, sampleRate, now) {
  if (sampleRate <= 0 || fft.length < 4)
    return new HardstyleFrame();
  this.kf_1.o7(fft, sampleRate);
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
      if (rangeUntil(30.0, 90.0).s6(hz)) {
        low = low + magnitude;
        nl = nl + 1 | 0;
      } else if (rangeUntil(90.0, 250.0).s6(hz)) {
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
    tmp_9 = coerceIn(1.0 - (tmp$ret$12 - 1.0) / voice, 0.0, 1.0);
  } else {
    tmp_9 = 0.0;
  }
  var tonality = tmp_9;
  var tmp0_0 = low;
  // Inline function 'kotlin.math.max' call
  var b_8 = bass;
  var value = Math.max(tmp0_0, b_8);
  var tmp_11;
  if (equalsLong(this.of_1, new Long(0, 0))) {
    tmp_11 = 0.016;
  } else {
    // Inline function 'kotlin.Long.div' call
    var this_0 = subtract(now, this.of_1);
    var tmp$ret$14 = toNumber(this_0) / 1000.0;
    tmp_11 = coerceIn(tmp$ret$14, 0.001, 0.2);
  }
  var dt = tmp_11;
  this.of_1 = now;
  var tmp_12 = this;
  var tmp_13 = this.lf_1;
  // Inline function 'kotlin.math.exp' call
  var x_2 = -dt / 3.0;
  // Inline function 'kotlin.math.max' call
  var b_9 = tmp_13 * Math.exp(x_2);
  // Inline function 'kotlin.math.max' call
  var b_10 = Math.max(value, b_9);
  tmp_12.lf_1 = Math.max(8.0, b_10);
  var tmp_14 = this;
  var tmp_15;
  if (value > this.bg_1) {
    var tmp_16 = this.bg_1;
    var tmp_17 = value - this.bg_1;
    // Inline function 'kotlin.math.exp' call
    var x_3 = -dt / 2.0;
    tmp_15 = tmp_16 + tmp_17 * (1.0 - Math.exp(x_3));
  } else {
    var tmp_18 = this.bg_1;
    // Inline function 'kotlin.math.exp' call
    var x_4 = -dt / 25.0;
    tmp_15 = tmp_18 * Math.exp(x_4);
  }
  tmp_14.bg_1 = tmp_15;
  var tmp0_1 = this.lf_1;
  // Inline function 'kotlin.math.max' call
  var b_11 = this.bg_1 * 0.55;
  var reference = Math.max(tmp0_1, b_11);
  var norm = value < 2.0 || value < this.bg_1 * 0.1 ? 0.0 : coerceIn(value / (reference * 1.3), 0.0, 1.0);
  var flatWeight = nf > 0 ? coerceIn((flatSum / nf - 2.0) / 3.0, 0.0, 1.0) : 0.0;
  var tmp_19;
  if (flatWeight > 0.0) {
    // Inline function 'kotlin.math.exp' call
    var x_5 = flatLog / nf;
    var tmp$ret$21 = Math.exp(x_5);
    tmp_19 = coerceIn(tmp$ret$21 / (flatSum / nf), 0.0, 1.0) * flatWeight;
  } else {
    tmp_19 = 0.0;
  }
  var noise = tmp_19;
  var centroid = centDen > 1.0 ? centNum / centDen : 0.0;
  var onset = value > 3.0 && value > this.nf_1 * 1.12 && value > this.mf_1 * 1.15 && compare(subtract(now, this.pf_1), new Long(120, 0)) >= 0;
  if (onset) {
    var gap = toNumber(subtract(now, this.pf_1));
    if (250.0 <= gap ? gap <= 1500.0 : false)
      this.tf_1 = this.tf_1 === 0.0 ? gap : this.tf_1 * 0.85 + gap * 0.15;
    this.pf_1 = now;
  }
  var snareOnset = snareBand > 3.0 && snareBand > this.uf_1 * 1.45 && snareBand > this.vf_1 * 1.15 && compare(subtract(now, this.wf_1), new Long(90, 0)) >= 0;
  if (snareOnset)
    this.wf_1 = now;
  var vocalOnset = voice > 2.5 && tonality > 0.35 && voice > this.eg_1 * 1.3 && voice > this.fg_1 * 1.12 && !onset && !snareOnset && compare(subtract(now, this.pf_1), new Long(80, 0)) > 0 && this.kg_1.i8_1 < 0.3 && compare(subtract(now, this.gg_1), new Long(180, 0)) >= 0;
  if (vocalOnset)
    this.gg_1 = now;
  var crashOnset = air > 2.0 && air > this.xf_1 * 1.8 && air > this.yf_1 * 1.3 && compare(subtract(now, this.zf_1), new Long(400, 0)) >= 0;
  if (crashOnset)
    this.zf_1 = now;
  // Inline function 'kotlin.math.max' call
  var b_12 = value - this.nf_1;
  var flux = Math.max(0.0, b_12);
  var tmp_20;
  var tmp_21;
  if (value > 3.0) {
    // Inline function 'kotlin.math.max' call
    var b_13 = this.ig_1 * 1.6;
    tmp_21 = flux > Math.max(1.5, b_13);
  } else {
    tmp_21 = false;
  }
  if (tmp_21) {
    tmp_20 = compare(subtract(now, this.jg_1), new Long(100, 0)) >= 0;
  } else {
    tmp_20 = false;
  }
  var candidate = tmp_20;
  if (candidate)
    this.jg_1 = now;
  this.ig_1 = this.ig_1 * 0.9 + flux * 0.1;
  if (onset && this.hg_1.wg_1 > 0.0 && compare(this.hg_1.xg_1, new Long(0, 0)) > 0 && this.hg_1.zg_1 >= 3) {
    var phase = toNumber(modulo(subtract(now, this.hg_1.xg_1), numberToLong(this.hg_1.wg_1))) / this.hg_1.wg_1;
    var off = (0.4 <= phase ? phase <= 0.6 : false) ? 1.0 : 0.0;
    this.dg_1 = this.dg_1 * 0.92 + off * 0.08;
  }
  var beat = this.hg_1.eh(now, candidate || onset, norm > 0.3, norm > 0.55);
  var burst = onset && norm > 0.55 && this.kg_1.w7_1 < 0.35 && compare(subtract(now, this.qf_1), new Long(1800, 0)) >= 0;
  if (burst)
    this.qf_1 = now;
  this.rf_1 = accept$smooth(dt, this.rf_1, value, 0.3);
  this.sf_1 = this.sf_1 === 0.0 ? value : accept$smooth(dt, this.sf_1, value, 12.0);
  var bassPresent = this.bg_1 > 0.0 ? coerceIn((value / this.bg_1 - 0.45) / 0.3, 0.0, 1.0) : 0.0;
  var tmp_22 = mid;
  // Inline function 'kotlin.math.max' call
  var tmp$ret$24 = Math.max(value, 12.0);
  var gritNow = coerceIn((tmp_22 / tmp$ret$24 - 0.35) / 0.5, 0.0, 1.0) * coerceIn(value / 20.0, 0.0, 1.0) * bassPresent;
  var tmp0_2 = this.pf_1;
  // Inline function 'kotlin.math.max' call
  var b_14 = this.hg_1.xg_1;
  var anchor = compare(tmp0_2, b_14) >= 0 ? tmp0_2 : b_14;
  var sinceKick = subtract(now, anchor);
  var tmp_23;
  if (compare(sinceKick, new Long(600, 0)) > 0) {
    var tmp_24 = this.cg_1;
    // Inline function 'kotlin.math.exp' call
    var x_6 = -dt / 0.3;
    tmp_23 = tmp_24 * Math.exp(x_6);
  } else if (compare(new Long(50, 0), sinceKick) <= 0 ? compare(sinceKick, new Long(250, 0)) <= 0 : false) {
    tmp_23 = gritNow;
  } else {
    var tmp_25 = this.cg_1;
    // Inline function 'kotlin.math.exp' call
    var x_7 = -dt / 0.6;
    tmp_23 = tmp_25 * Math.exp(x_7);
  }
  var grit = tmp_23;
  this.cg_1 = grit;
  var tmp_26 = this.rf_1;
  // Inline function 'kotlin.math.max' call
  var b_15 = this.sf_1;
  var tmp$ret$28 = Math.max(4.0, b_15);
  var lift = coerceIn((tmp_26 / tmp$ret$28 - 1.0) / 0.8, 0.0, 1.0);
  var loudRel = this.bg_1 > 0.0 ? coerceIn((this.rf_1 / this.bg_1 - 0.45) / 0.45, 0.0, 1.0) : 0.0;
  var heavyRaw = norm * norm * (0.4 * grit + 0.15 * lift + 0.25 * loudRel + 0.2 * norm);
  var heavyTarget = coerceIn((heavyRaw - 0.12) / 0.4, 0.0, 1.0);
  var tmp_27 = this;
  var tmp_28 = accept$smooth(dt, this.kg_1.t7_1, norm, norm > this.kg_1.t7_1 ? 0.025 : 0.18);
  var tmp_29;
  if (beat) {
    tmp_29 = this.hg_1.fh() ? 0.85 : 1.0;
  } else if (onset) {
    var tmp_30 = this.kg_1.u7_1;
    // Inline function 'kotlin.math.exp' call
    var x_8 = -dt / 0.085;
    // Inline function 'kotlin.math.max' call
    var b_16 = tmp_30 * Math.exp(x_8);
    tmp_29 = Math.max(0.7, b_16);
  } else {
    var tmp_31 = this.kg_1.u7_1;
    // Inline function 'kotlin.math.exp' call
    var x_9 = -dt / 0.085;
    tmp_29 = tmp_31 * Math.exp(x_9);
  }
  var tmp_32 = tmp_29;
  var tmp_33 = this.kg_1.v7_1;
  var tmp_34 = high;
  // Inline function 'kotlin.math.max' call
  var b_17 = this.lf_1;
  var tmp$ret$32 = Math.max(8.0, b_17);
  var tmp_35 = accept$smooth(dt, tmp_33, coerceIn(tmp_34 / tmp$ret$32, 0.0, 1.0), 0.08);
  var tmp_36 = accept$smooth(dt, this.kg_1.w7_1, norm, 0.8);
  var tmp_37;
  if (burst) {
    tmp_37 = 1.0;
  } else {
    var tmp_38 = this.kg_1.x7_1;
    // Inline function 'kotlin.math.exp' call
    var x_10 = -dt / 0.35;
    tmp_37 = tmp_38 * Math.exp(x_10);
  }
  var tmp_39 = tmp_37;
  var tmp_40 = accept$smooth(dt, this.kg_1.y7_1, burst || this.kg_1.x7_1 > 0.1 ? 0.0 : coerceIn((norm - this.kg_1.w7_1) / 0.35, 0.0, 1.0), 0.3);
  var tmp_41 = this.jf_1.gh(fft, sampleRate, dt);
  var tmp_42 = this.jf_1.rg_1;
  var tmp_43 = accept$smooth(dt, this.kg_1.b8_1, heavyTarget, heavyTarget > this.kg_1.b8_1 ? 0.02 : 0.5);
  var tmp_44 = accept$smooth(dt, this.kg_1.c8_1, grit, grit > this.kg_1.c8_1 ? 0.02 : 0.25);
  var tmp_45 = this.hg_1.wg_1 > 0.0 ? 60000.0 / this.hg_1.wg_1 : 0.0;
  var tmp_46;
  if (snareOnset) {
    tmp_46 = 1.0;
  } else {
    var tmp_47 = this.kg_1.e8_1;
    // Inline function 'kotlin.math.exp' call
    var x_11 = -dt / 0.09;
    tmp_46 = tmp_47 * Math.exp(x_11);
  }
  var tmp_48 = tmp_46;
  var tmp_49;
  if (crashOnset) {
    tmp_49 = 1.0;
  } else {
    var tmp_50 = this.kg_1.f8_1;
    // Inline function 'kotlin.math.exp' call
    var x_12 = -dt / 0.18;
    tmp_49 = tmp_50 * Math.exp(x_12);
  }
  var tmp_51 = tmp_49;
  var tmp_52 = this.kg_1.g8_1;
  var tmp_53;
  if (value > 3.0) {
    var tmp_54 = low;
    // Inline function 'kotlin.math.max' call
    var b_18 = low + bass;
    var tmp$ret$36 = Math.max(1.0, b_18);
    tmp_53 = coerceIn(tmp_54 / tmp$ret$36, 0.0, 1.0);
  } else {
    tmp_53 = this.kg_1.g8_1;
  }
  var tmp_55 = accept$smooth(dt, tmp_52, tmp_53, 0.4);
  var tmp_56 = value + mid;
  // Inline function 'kotlin.run' call
  var target = scr > 3.0 && this.ag_1 > 0.0 ? coerceIn((scr / this.ag_1 - 1.5) / 1.2, 0.0, 1.0) : 0.0;
  var tmp_57 = accept$smooth(dt, this.kg_1.i8_1, target, target > this.kg_1.i8_1 ? 0.12 : 0.3);
  var tmp_58 = air;
  var tmp_59 = low;
  var tmp_60 = scr;
  var tmp_61 = this.hg_1.ch_1;
  var tmp_62 = this.hg_1.xg_1;
  var tmp_63 = this.hg_1.wg_1;
  var tmp_64 = this.hg_1.zg_1;
  var tmp_65 = accept$smooth(dt, this.kg_1.r8_1, noise, 0.3);
  var tmp_66 = accept$smooth(dt, this.kg_1.s8_1, centroid, 0.3);
  var tmp_67 = this.dg_1;
  // Inline function 'kotlin.run' call
  var target_0 = voice > 2.0 && this.eg_1 > 0.0 ? coerceIn((voice / this.eg_1 - 1.0) / 0.6, 0.0, 1.0) * coerceIn((tonality - 0.25) / 0.35, 0.0, 1.0) * (1.0 - this.kg_1.i8_1) : 0.0;
  var tmp_68 = accept$smooth(dt, this.kg_1.u8_1, target_0, target_0 > this.kg_1.u8_1 ? 0.08 : 0.4);
  var tmp_69;
  if (vocalOnset) {
    tmp_69 = 1.0;
  } else {
    var tmp_70 = this.kg_1.v8_1;
    // Inline function 'kotlin.math.exp' call
    var x_13 = -dt / 0.3;
    tmp_69 = tmp_70 * Math.exp(x_13);
  }
  tmp_27.kg_1 = new HardstyleFrame(tmp_28, tmp_32, tmp_35, tmp_36, tmp_39, tmp_40, tmp_41, tmp_42, tmp_43, tmp_44, tmp_45, tmp_48, tmp_51, tmp_55, tmp_56, tmp_57, value, tmp_58, tmp_59, tmp_60, tmp_61, tmp_62, tmp_63, tmp_64, tmp_65, tmp_66, tmp_67, tmp_68, tmp_69);
  this.mf_1 = accept$smooth(dt, this.mf_1, value, 0.5);
  this.nf_1 = value;
  this.eg_1 = this.eg_1 === 0.0 ? voice : accept$smooth(dt, this.eg_1, voice, 8.0);
  this.fg_1 = voice;
  this.ag_1 = this.ag_1 === 0.0 ? scr : accept$smooth(dt, this.ag_1, scr, 6.0);
  this.uf_1 = accept$smooth(dt, this.uf_1, snareBand, 0.6);
  this.vf_1 = snareBand;
  this.xf_1 = accept$smooth(dt, this.xf_1, air, 0.8);
  this.yf_1 = air;
  return this.kg_1;
};
function addOnset($this, now) {
  $this.sg_1[$this.ug_1] = now;
  $this.ug_1 = ($this.ug_1 + 1 | 0) % $this.sg_1.length | 0;
  var tmp = $this;
  var tmp0 = $this.tg_1 + 1 | 0;
  // Inline function 'kotlin.comparisons.minOf' call
  var b = $this.sg_1.length;
  tmp.tg_1 = Math.min(tmp0, b);
  fill_0($this.vg_1, 0.0);
  var inductionVariable = 0;
  var last = $this.tg_1;
  if (inductionVariable < last)
    $l$loop: do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var a = $this.sg_1[i];
      if (compare(subtract(now, a), new Long(6000, 0)) > 0)
        continue $l$loop;
      var inductionVariable_0 = 0;
      var last_0 = $this.tg_1;
      if (inductionVariable_0 < last_0)
        $l$loop_0: do {
          var j = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var d = toNumber(subtract($this.sg_1[j], a));
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
              var _array__4zh2yp = $this.vg_1;
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
  var last_1 = $this.vg_1.length - 1 | 0;
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
  if ($this.bh_1 > 0.0 && best >= 0) {
    // Inline function 'kotlin.math.roundToInt' call
    var this_0 = ($this.bh_1 - 245.0) / 10.0;
    var tmp$ret$1 = roundToInt(this_0);
    var hb = coerceIn_0(tmp$ret$1, 0, $this.vg_1.length - 1 | 0);
    var hBest = -1;
    var hScore = 0.0;
    var inductionVariable_3 = hb - 2 | 0;
    var last_2 = hb + 2 | 0;
    if (inductionVariable_3 <= last_2)
      do {
        var b_1 = inductionVariable_3;
        inductionVariable_3 = inductionVariable_3 + 1 | 0;
        if ((0 <= b_1 ? b_1 <= ($this.vg_1.length - 1 | 0) : false) && addOnset$score($this, b_1) > hScore) {
          hScore = addOnset$score($this, b_1);
          hBest = b_1;
        }
      }
       while (!(b_1 === last_2));
    if (hBest >= 0 && $this.tg_1 >= 6 && hScore >= 2.5 && hScore >= bestScore * 0.3) {
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
      if (double < $this.vg_1.length && $this.vg_1[double] >= $this.vg_1[best] * 0.5)
        best = double;
    }
    var estimate = 245.0 + best * 10.0;
    $this.wg_1 = $this.wg_1 === 0.0 ? estimate : $this.wg_1 * 0.8 + estimate * 0.2;
  }
}
function addOnset$score(this$0, b) {
  var tmp = this$0.vg_1[b];
  var tmp0 = this$0.vg_1;
  // Inline function 'kotlin.collections.getOrElse' call
  var index = b - 1 | 0;
  var tmp_0;
  if (0 <= index ? index <= (tmp0.length - 1 | 0) : false) {
    tmp_0 = tmp0[index];
  } else {
    tmp_0 = 0.0;
  }
  var tmp_1 = tmp_0;
  var tmp0_0 = this$0.vg_1;
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
  this.sg_1 = longArray(48);
  this.tg_1 = 0;
  this.ug_1 = 0;
  this.vg_1 = new Float32Array(29);
  this.wg_1 = 0.0;
  this.xg_1 = new Long(0, 0);
  this.yg_1 = new Long(0, 0);
  this.zg_1 = 0;
  this.ah_1 = 0;
  this.bh_1 = 0.0;
  this.ch_1 = 0;
}
protoOf(BeatTracker).fh = function () {
  return this.ah_1 > 2;
};
protoOf(BeatTracker).n7 = function () {
  this.tg_1 = 0;
  this.ug_1 = 0;
  this.wg_1 = 0.0;
  this.xg_1 = new Long(0, 0);
  this.yg_1 = new Long(0, 0);
  this.zg_1 = 0;
  this.ah_1 = 0;
  this.ch_1 = 0;
};
protoOf(BeatTracker).eh = function (now, onset, bassPresent, strongBass) {
  var beat = false;
  if (onset) {
    addOnset(this, now);
    this.yg_1 = now;
    if (this.wg_1 > 0.0 && compare(this.xg_1, new Long(0, 0)) > 0) {
      var since = toNumber(subtract(now, this.xg_1));
      var err = (since + this.wg_1 / 2.0) % this.wg_1 - this.wg_1 / 2.0;
      // Inline function 'kotlin.math.abs' call
      if (Math.abs(err) < this.wg_1 * 0.22) {
        if (since > this.wg_1 * 0.5) {
          beat = true;
          var tmp = this;
          // Inline function 'kotlin.comparisons.minOf' call
          var a = this.zg_1 + 1 | 0;
          tmp.zg_1 = Math.min(a, 8);
          this.ah_1 = 0;
        }
        this.xg_1 = now;
      } else {
        if (this.zg_1 < 2) {
          beat = true;
          this.xg_1 = now;
        }
      }
    } else {
      beat = true;
      this.xg_1 = now;
    }
  }
  if (!beat && this.wg_1 > 0.0 && compare(this.xg_1, new Long(0, 0)) > 0 && this.zg_1 >= 3 && bassPresent && this.ah_1 < (strongBass ? 8 : 2) && toNumber(subtract(now, this.xg_1)) >= this.wg_1 - 25.0) {
    beat = true;
    this.xg_1 = add(this.xg_1, numberToLong(this.wg_1));
    if (!strongBass || (this.ah_1 % 4 | 0) === 0)
      this.zg_1 = this.zg_1 - 1 | 0;
    this.ah_1 = this.ah_1 + 1 | 0;
  }
  if (this.wg_1 > 0.0 && compare(this.xg_1, new Long(0, 0)) > 0 && toNumber(subtract(now, this.xg_1)) > this.wg_1 * 2.5)
    this.zg_1 = 0;
  if (beat) {
    this.ch_1 = this.ch_1 + 1 | 0;
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
  this.mg_1 = new Float32Array(48);
  this.ng_1 = new Float32Array(48);
  this.og_1 = new Float32Array(48);
  this.pg_1 = 8.0;
  this.qg_1 = 0.0;
  this.rg_1 = 0.0;
}
protoOf(HardstyleSpectrum).n7 = function () {
  fill_0(this.mg_1, 0.0);
  fill_0(this.ng_1, 0.0);
  fill_0(this.og_1, 0.0);
  this.pg_1 = 8.0;
  this.qg_1 = 0.0;
  this.rg_1 = 0.0;
};
protoOf(HardstyleSpectrum).gh = function (fft, sampleRate, dt) {
  var binHz = sampleRate / fft.length;
  var lastBin = (fft.length / 2 | 0) - 1 | 0;
  var inductionVariable = 0;
  var last = this.ng_1.length - 1 | 0;
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
      this.ng_1[i] = tmp;
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
      var b_3 = this.ng_1[i_0] - this.og_1[i_0];
      positiveFlux = tmp_0 + Math.max(0.0, b_3);
    }
     while (inductionVariable_1 < 48);
  var tmp_1 = this;
  var tmp_2 = positiveFlux / 16.0;
  // Inline function 'kotlin.math.max' call
  var b_4 = this.pg_1;
  var tmp$ret$10 = Math.max(8.0, b_4);
  tmp_1.rg_1 = coerceIn(tmp_2 / tmp$ret$10 * 3.0, 0.0, 1.0);
  var tmp0_0 = this.ng_1;
  // Inline function 'kotlin.collections.copyInto' call
  var destination = this.og_1;
  var endIndex = tmp0_0.length;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_3 = tmp0_0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp_3, destination, 0, 0, endIndex);
  var tmp0_elvis_lhs = maxOrNull(this.ng_1);
  var loudest = tmp0_elvis_lhs == null ? 0.0 : tmp0_elvis_lhs;
  var tmp_4 = this;
  var tmp_5;
  if (loudest > this.qg_1) {
    var tmp_6 = this.qg_1;
    var tmp_7 = loudest - this.qg_1;
    // Inline function 'kotlin.math.exp' call
    var x_3 = -dt / 2.0;
    tmp_5 = tmp_6 + tmp_7 * (1.0 - Math.exp(x_3));
  } else {
    var tmp_8 = this.qg_1;
    // Inline function 'kotlin.math.exp' call
    var x_4 = -dt / 25.0;
    tmp_5 = tmp_8 * Math.exp(x_4);
  }
  tmp_4.qg_1 = tmp_5;
  var tmp_9 = this;
  var tmp_10 = this.pg_1;
  // Inline function 'kotlin.math.exp' call
  var x_5 = -dt / 3.0;
  var tmp2 = tmp_10 * Math.exp(x_5);
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = this.qg_1 * 0.55;
  // Inline function 'kotlin.math.max' call
  var b_5 = Math.max(loudest, tmp2, c);
  tmp_9.pg_1 = Math.max(8.0, b_5);
  var inductionVariable_2 = 0;
  var last_0 = this.mg_1.length - 1 | 0;
  if (inductionVariable_2 <= last_0)
    do {
      var i_1 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      // Inline function 'kotlin.math.max' call
      var b_6 = i_1 - 1 | 0;
      var tmp$ret$21 = Math.max(0, b_6);
      var tmp_11 = this.ng_1[tmp$ret$21] * 0.15 + this.ng_1[i_1] * 0.7;
      var tmp0_1 = get_lastIndex_2(this.ng_1);
      // Inline function 'kotlin.math.min' call
      var b_7 = i_1 + 1 | 0;
      var tmp$ret$22 = Math.min(tmp0_1, b_7);
      var neighbor = tmp_11 + this.ng_1[tmp$ret$22] * 0.15;
      var ratio = neighbor / this.pg_1;
      // Inline function 'kotlin.math.ln' call
      var x_6 = 1.0 + 3.0 * ratio;
      var tmp_12 = Math.log(x_6);
      // Inline function 'kotlin.math.ln' call
      var tmp$ret$24 = Math.log(5.0);
      var target = coerceIn(tmp_12 / tmp$ret$24, 0.0, 1.0);
      var seconds = target > this.mg_1[i_1] ? 0.01 : 0.07;
      var _array__4zh2yp = this.mg_1;
      var tmp_13 = _array__4zh2yp[i_1];
      var tmp_14 = target - this.mg_1[i_1];
      // Inline function 'kotlin.math.exp' call
      var x_7 = -dt / seconds;
      _array__4zh2yp[i_1] = tmp_13 + tmp_14 * (1.0 - Math.exp(x_7));
      if (this.mg_1[i_1] < 1.0E-4) {
        this.mg_1[i_1] = 0.0;
      }
    }
     while (inductionVariable_2 <= last_0);
  return toList(this.mg_1);
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
function get_ORB_BANDS() {
  _init_properties_OrbGeometry_kt__mo1801();
  return ORB_BANDS;
}
var ORB_BANDS;
function get_ORB_LAYERS() {
  _init_properties_OrbGeometry_kt__mo1801();
  return ORB_LAYERS;
}
var ORB_LAYERS;
function OrbBandSpec(fromHz, toHz, span, attackS, releaseS, share) {
  this.hh_1 = fromHz;
  this.ih_1 = toHz;
  this.jh_1 = span;
  this.kh_1 = attackS;
  this.lh_1 = releaseS;
  this.mh_1 = share;
}
function OrbLayerSpec(slow, smoothPasses, size, restAlpha) {
  this.nh_1 = slow;
  this.oh_1 = smoothPasses;
  this.ph_1 = size;
  this.qh_1 = restAlpha;
}
var static_init_called_3;
function static_init_3() {
  if (static_init_called_3)
    return Unit_instance;
  static_init_called_3 = true;
  OrbSource_PCM_instance = new OrbSource('PCM', 0, 1.5, 5.0, 4.0);
  OrbSource_VISUALIZER_instance = new OrbSource('VISUALIZER', 1, 2.5, 12.0, 10.0);
}
var OrbSource_PCM_instance;
var OrbSource_VISUALIZER_instance;
function OrbSource(name, ordinal, noiseFloor, refFloor, openMinLevel) {
  Enum.call(this, name, ordinal);
  this.th_1 = noiseFloor;
  this.uh_1 = refFloor;
  this.vh_1 = openMinLevel;
}
function auraLayerAlpha(layer) {
  _init_properties_OrbGeometry_kt__mo1801();
  // Inline function 'kotlin.math.pow' call
  return 0.5 * Math.pow(0.6, layer);
}
function auraLayerColorShift(layer) {
  _init_properties_OrbGeometry_kt__mo1801();
  return imul_0(layer, 1);
}
function auraLayerDrift(layer) {
  _init_properties_OrbGeometry_kt__mo1801();
  return true && (layer % 2 | 0) === 1 ? -1.0 : 1.0;
}
function coverPulseScale(breath, kick, heavy, volume, phaseLevel) {
  _init_properties_OrbGeometry_kt__mo1801();
  return coerceIn(1.0 + breath * 0.05 + kick * (0.015 + heavy * 0.025) * volumeGain(volume) * (0.4 + 0.6 * phaseLevel), 1.0, 1.0899999);
}
function easeCoverKick(eased, kick, dt) {
  _init_properties_OrbGeometry_kt__mo1801();
  if (!(dt > 0.0))
    return eased;
  var tau = kick > eased ? 0.03 : 0.14;
  var tmp = kick - eased;
  // Inline function 'kotlin.math.min' call
  // Inline function 'kotlin.math.exp' call
  var x = -Math.min(dt, 0.1) / tau;
  return eased + tmp * (1.0 - Math.exp(x));
}
function sane($this, value) {
  return isFinite(value) ? value : 0.0;
}
function rate($this, seconds, tau) {
  var tmp;
  if (seconds > 0.0) {
    // Inline function 'kotlin.math.exp' call
    var x = -seconds / tau;
    tmp = 1.0 - Math.exp(x);
  } else {
    tmp = 0.0;
  }
  return tmp;
}
function listen($this, bands, dt) {
  var lastBand = bands.length - 1 | 0;
  var floors = $this.zh_1;
  fill_0($this.aj_1, 0.0);
  if (lastBand < 0) {
    fill_0($this.mi_1, 0.0);
  } else {
    var inductionVariable = 0;
    var last = $this.ei_1;
    if (inductionVariable <= last)
      do {
        var j = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        var position = coerceIn($this.ii_1[j], 0.0, lastBand);
        var index = numberToInt(position);
        // Inline function 'kotlin.math.min' call
        var a = index + 1 | 0;
        var next = Math.min(a, lastBand);
        var heard = bands[index] + (bands[next] - bands[index]) * (position - index) - floors.th_1;
        $this.mi_1[j] = heard > 0.0 && isFinite(heard) ? heard : 0.0;
        var tmp = $this.hi_1[j];
        var tmp0 = $this.aj_1[$this.hi_1[j]];
        // Inline function 'kotlin.math.max' call
        var b = $this.mi_1[j];
        var tmp$ret$1 = Math.max(tmp0, b);
        $this.aj_1[tmp] = tmp$ret$1;
      }
       while (!(j === last));
  }
  var total = 0.0;
  var inductionVariable_0 = 0;
  var last_0 = $this.gi_1;
  if (inductionVariable_0 < last_0)
    do {
      var r = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      var peak = $this.aj_1[r];
      $this.zi_1[r] = follow($this, $this.zi_1[r], peak, dt);
      var tmp0_0 = floors.uh_1;
      var tmp_0 = $this.yi_1[r];
      // Inline function 'kotlin.math.exp' call
      var x = -dt / 3.0;
      var tmp0_1 = tmp_0 * Math.exp(x);
      // Inline function 'kotlin.math.max' call
      var b_0 = $this.zi_1[r] * 0.55;
      // Inline function 'kotlin.math.max' call
      var b_1 = Math.max(tmp0_1, b_0);
      // Inline function 'kotlin.math.max' call
      var b_2 = Math.max(peak, b_1);
      var tmp$ret$5 = Math.max(tmp0_0, b_2);
      $this.yi_1[r] = tmp$ret$5;
      total = total + peak;
    }
     while (inductionVariable_0 < last_0);
  $this.ej_1 = follow($this, $this.ej_1, total, dt);
  var tmp_1 = $this;
  var tmp_2;
  if (total < floors.vh_1) {
    tmp_2 = 0.0;
  } else {
    var tmp_3 = total;
    // Inline function 'kotlin.math.max' call
    var a_0 = $this.ej_1;
    var tmp$ret$6 = Math.max(a_0, 0.001);
    tmp_2 = coerceIn(tmp_3 / tmp$ret$6, 0.0, 1.0);
  }
  tmp_1.fj_1 = tmp_2;
  var main = $this.ni_1[0];
  var bass = 0.0;
  var bassPoints = 0;
  var inductionVariable_1 = 0;
  var last_1 = $this.ei_1;
  if (inductionVariable_1 <= last_1)
    do {
      var j_0 = inductionVariable_1;
      inductionVariable_1 = inductionVariable_1 + 1 | 0;
      var r_0 = $this.hi_1[j_0];
      var peak_0 = $this.aj_1[r_0];
      var tmp_4;
      if (peak_0 > 0.0) {
        // Inline function 'kotlin.math.pow' call
        var this_0 = $this.mi_1[j_0] / peak_0;
        var tmp_5 = Math.pow(this_0, 1.6);
        // Inline function 'kotlin.math.pow' call
        var this_1 = coerceIn(peak_0 / $this.yi_1[r_0], 0.0, 1.0);
        tmp_4 = tmp_5 * Math.pow(this_1, 0.5);
      } else {
        tmp_4 = 0.0;
      }
      var v = tmp_4;
      if (r_0 === 0) {
        bass = bass + v;
        bassPoints = bassPoints + 1 | 0;
      }
      main[j_0] = coerceIn(v, 0.0, 1.0) * $this.ji_1[j_0];
    }
     while (!(j_0 === last_1));
  $this.dj_1 = bassPoints > 0 ? coerceIn(bass / bassPoints, 0.0, 1.0) : 0.0;
  // Inline function 'kotlin.repeat' call
  var inductionVariable_2 = 0;
  if (inductionVariable_2 < 2)
    do {
      var index_0 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      blur($this, main);
    }
     while (inductionVariable_2 < 2);
  var inductionVariable_3 = 1;
  var last_2 = $this.yh_1;
  if (inductionVariable_3 < last_2)
    do {
      var l = inductionVariable_3;
      inductionVariable_3 = inductionVariable_3 + 1 | 0;
      // Inline function 'kotlin.collections.copyInto' call
      var destination = $this.ni_1[l];
      var endIndex = main.length;
      // Inline function 'kotlin.js.unsafeCast' call
      // Inline function 'kotlin.js.asDynamic' call
      var tmp_6 = main;
      // Inline function 'kotlin.js.unsafeCast' call
      // Inline function 'kotlin.js.asDynamic' call
      arrayCopy(tmp_6, destination, 0, 0, endIndex);
      // Inline function 'kotlin.repeat' call
      var times = $this.wh_1.m(l).oh_1;
      var inductionVariable_4 = 0;
      if (inductionVariable_4 < times)
        do {
          var index_1 = inductionVariable_4;
          inductionVariable_4 = inductionVariable_4 + 1 | 0;
          blur($this, $this.ni_1[l]);
        }
         while (inductionVariable_4 < times);
    }
     while (inductionVariable_3 < last_2);
}
function follow($this, reference, value, dt) {
  var tmp;
  if (value > reference) {
    var tmp_0 = value - reference;
    // Inline function 'kotlin.math.exp' call
    var x = -dt / 2.0;
    tmp = reference + tmp_0 * (1.0 - Math.exp(x));
  } else {
    // Inline function 'kotlin.math.exp' call
    var x_0 = -dt / 25.0;
    tmp = reference * Math.exp(x_0);
  }
  return tmp;
}
function blur($this, values) {
  var previous = values[1];
  var inductionVariable = 0;
  var last = $this.ei_1;
  if (inductionVariable <= last)
    do {
      var j = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var current = values[j];
      var next = j < $this.ei_1 ? values[j + 1 | 0] : previous;
      values[j] = 0.25 * previous + 0.5 * current + 0.25 * next;
      previous = current;
    }
     while (!(j === last));
}
function smoothLevels($this, steps, h) {
  var inductionVariable = 0;
  var last = $this.yh_1;
  if (inductionVariable < last)
    do {
      var l = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var slow = $this.wh_1.m(l).nh_1;
      var goal = $this.ni_1[l];
      var first = $this.oi_1[l];
      var second = $this.pi_1[l];
      var sum = 0.0;
      var inductionVariable_0 = 0;
      var last_0 = $this.ei_1;
      if (inductionVariable_0 <= last_0)
        do {
          var j = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + 1 | 0;
          var up = rate($this, h, $this.ki_1[j] * slow * 0.5);
          var down = rate($this, h, $this.li_1[j] * slow * 0.5);
          var t = goal[j];
          var a = first[j];
          var b = second[j];
          // Inline function 'kotlin.repeat' call
          var inductionVariable_1 = 0;
          if (inductionVariable_1 < steps)
            do {
              var index = inductionVariable_1;
              inductionVariable_1 = inductionVariable_1 + 1 | 0;
              a = a + (t - a) * (t > a ? up : down);
              b = b + (a - b) * (a > b ? up : down);
            }
             while (inductionVariable_1 < steps);
          if (t === 0.0 && a < 1.0E-4) {
            a = 0.0;
            if (b < 1.0E-4)
              b = 0.0;
          }
          first[j] = a;
          second[j] = b;
          sum = sum + (j === 0 || j === $this.ei_1 ? b * 0.5 : b);
        }
         while (!(j === last_0));
      $this.cj_1[l] = coerceIn(sum / $this.ei_1, 0.0, 1.0);
    }
     while (inductionVariable < last);
}
function knee($this, value, cap) {
  if (cap <= 0.0)
    return 0.0;
  var from = cap * 0.75;
  var tmp;
  if (value <= from) {
    tmp = value;
  } else {
    var tmp_0 = cap - from;
    // Inline function 'kotlin.math.tanh' call
    var x = (value - from) / (cap - from);
    tmp = from + tmp_0 * tanh(x);
  }
  return tmp;
}
function outline($this, halfSide, radius) {
  var tmp;
  if (radius > 0.0) {
    // Inline function 'kotlin.math.min' call
    tmp = Math.min(radius, halfSide);
  } else {
    tmp = 0.0;
  }
  var r = tmp;
  var flat = halfSide - r;
  var arc = 3.141592653589793 / 2 * r;
  var length = 4.0 * flat + 2.0 * arc;
  var inductionVariable = 0;
  var last = $this.ei_1;
  if (inductionVariable <= last)
    $l$loop_2: do {
      var j = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var s = length * j / $this.ei_1;
      if (j === 0 || s < flat) {
        $this.ui_1[j] = j === 0 ? 0.0 : s;
        $this.vi_1[j] = -halfSide;
        $this.wi_1[j] = 0.0;
        $this.xi_1[j] = -1.0;
        continue $l$loop_2;
      }
      s = s - flat;
      if (s < arc && r > 0.0) {
        var a = s / r;
        // Inline function 'kotlin.math.sin' call
        var tmp$ret$1 = Math.sin(a);
        $this.wi_1[j] = tmp$ret$1;
        // Inline function 'kotlin.math.cos' call
        var tmp$ret$2 = Math.cos(a);
        $this.xi_1[j] = -tmp$ret$2;
        $this.ui_1[j] = flat + r * $this.wi_1[j];
        $this.vi_1[j] = -flat + r * $this.xi_1[j];
        continue $l$loop_2;
      }
      s = s - arc;
      if (s < 2.0 * flat) {
        $this.ui_1[j] = halfSide;
        $this.vi_1[j] = -flat + s;
        $this.wi_1[j] = 1.0;
        $this.xi_1[j] = 0.0;
        continue $l$loop_2;
      }
      s = s - 2.0 * flat;
      if (s < arc && r > 0.0 && j < $this.ei_1) {
        var a_0 = s / r;
        // Inline function 'kotlin.math.cos' call
        var tmp$ret$3 = Math.cos(a_0);
        $this.wi_1[j] = tmp$ret$3;
        // Inline function 'kotlin.math.sin' call
        var tmp$ret$4 = Math.sin(a_0);
        $this.xi_1[j] = tmp$ret$4;
        $this.ui_1[j] = flat + r * $this.wi_1[j];
        $this.vi_1[j] = flat + r * $this.xi_1[j];
        continue $l$loop_2;
      }
      s = s - arc;
      $this.ui_1[j] = j === $this.ei_1 ? 0.0 : coerceIn(flat - s, 0.0, flat);
      $this.vi_1[j] = halfSide;
      $this.wi_1[j] = 0.0;
      $this.xi_1[j] = 1.0;
    }
     while (!(j === last));
}
function shape_0($this, coverSide, cornerRadius, coverScale, spike, volume, heavy, step) {
  var side = coverSide > 0.0 && isFinite(coverSide) ? coverSide : 0.0;
  var scale = isFinite(coverScale) ? coerceIn(coverScale, 0.1, 10.0) : 1.0;
  outline($this, side * 0.5 * scale, cornerRadius * scale);
  var openAmp = 0.06 + (1.0 - 0.06) * $this.ai_1;
  var drive = coerceIn(spike, 0.0, 2.0) * volumeGain(volume);
  var full = side * 0.23 * maxVolumeBoost(volume) * openAmp;
  var gap = side * 0.02;
  var pumpPx = side * 0.01 * $this.ij_1 * $this.ai_1 * (0.4 + (1.0 - 0.4) * heavy);
  // Inline function 'kotlin.math.max' call
  var a = side * 0.21 - gap;
  var ceiling = Math.max(a, 0.0);
  $this.ci_1 = gap + ceiling;
  var resized = !(side === $this.kj_1);
  $this.kj_1 = side;
  var furthest = side * 0.7 * step;
  var inductionVariable = 0;
  if (inductionVariable < 128)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var j = i <= $this.ei_1 ? i : 128 - i | 0;
      $this.ti_1[imul_0(i, 2)] = i <= $this.ei_1 ? $this.ui_1[j] : -$this.ui_1[j];
      $this.ti_1[imul_0(i, 2) + 1 | 0] = $this.vi_1[j];
    }
     while (inductionVariable < 128);
  var inductionVariable_0 = 0;
  var last = $this.yh_1;
  if (inductionVariable_0 < last)
    do {
      var l = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      var size = $this.wh_1.m(l).ph_1;
      var off = $this.qi_1[l];
      var level = $this.pi_1[l];
      var p = $this.ri_1[l];
      var inductionVariable_1 = 0;
      var last_0 = $this.ei_1;
      if (inductionVariable_1 <= last_0)
        do {
          var j_0 = inductionVariable_1;
          inductionVariable_1 = inductionVariable_1 + 1 | 0;
          var v = level[j_0];
          var wanted = gap + knee($this, (v * (1.0 + 0.2 * heavy * v) * drive * full + pumpPx) * size, ceiling);
          var o = resized ? wanted : coerceIn(off[j_0] + coerceIn(wanted - off[j_0], -furthest, furthest), gap, gap + ceiling);
          off[j_0] = o;
          var x = $this.ui_1[j_0] + $this.wi_1[j_0] * o;
          var y = $this.vi_1[j_0] + $this.xi_1[j_0] * o;
          p[imul_0(j_0, 2)] = x;
          p[imul_0(j_0, 2) + 1 | 0] = y;
          if (1 <= j_0 ? j_0 < $this.ei_1 : false) {
            var m = 128 - j_0 | 0;
            p[imul_0(m, 2)] = -x;
            p[imul_0(m, 2) + 1 | 0] = y;
          }
        }
         while (!(j_0 === last_0));
      var c = $this.si_1[l];
      var inductionVariable_2 = 0;
      if (inductionVariable_2 < 128)
        do {
          var i_0 = inductionVariable_2;
          inductionVariable_2 = inductionVariable_2 + 1 | 0;
          var i0 = imul_0(((i_0 + 128 | 0) - 1 | 0) % 128 | 0, 2);
          var i1 = imul_0(i_0, 2);
          var i2 = imul_0((i_0 + 1 | 0) % 128 | 0, 2);
          var i3 = imul_0((i_0 + 2 | 0) % 128 | 0, 2);
          var o_0 = imul_0(i_0, 6);
          c[o_0] = p[i1] + (p[i2] - p[i0]) * 0.16;
          c[o_0 + 1 | 0] = p[i1 + 1 | 0] + (p[i2 + 1 | 0] - p[i0 + 1 | 0]) * 0.16;
          c[o_0 + 2 | 0] = p[i2] - (p[i3] - p[i1]) * 0.16;
          c[o_0 + 3 | 0] = p[i2 + 1 | 0] - (p[i3 + 1 | 0] - p[i1 + 1 | 0]) * 0.16;
          c[o_0 + 4 | 0] = p[i2];
          c[o_0 + 5 | 0] = p[i2 + 1 | 0];
        }
         while (inductionVariable_2 < 128);
    }
     while (inductionVariable_0 < last);
}
function OrbGeometry(layers, ranges) {
  layers = layers === VOID ? get_ORB_LAYERS() : layers;
  ranges = ranges === VOID ? get_ORB_BANDS() : ranges;
  this.wh_1 = layers;
  this.xh_1 = ranges;
  this.yh_1 = this.wh_1.q();
  this.zh_1 = OrbSource_PCM_getInstance();
  this.ai_1 = 0.0;
  this.bi_1 = 0.25;
  this.ci_1 = 0.0;
  this.di_1 = 0.0;
  this.ei_1 = 64;
  this.fi_1 = this.ei_1 + 1 | 0;
  this.gi_1 = this.xh_1.q();
  this.hi_1 = new Int32Array(this.fi_1);
  this.ii_1 = new Float32Array(this.fi_1);
  this.ji_1 = new Float32Array(this.fi_1);
  this.ki_1 = new Float32Array(this.fi_1);
  this.li_1 = new Float32Array(this.fi_1);
  this.mi_1 = new Float32Array(this.fi_1);
  var tmp = this;
  var tmp_0 = 0;
  var tmp_1 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_2 = Array(tmp_1);
  while (tmp_0 < tmp_1) {
    tmp_2[tmp_0] = new Float32Array(this.fi_1);
    tmp_0 = tmp_0 + 1 | 0;
  }
  tmp.ni_1 = tmp_2;
  var tmp_3 = this;
  var tmp_4 = 0;
  var tmp_5 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_6 = Array(tmp_5);
  while (tmp_4 < tmp_5) {
    tmp_6[tmp_4] = new Float32Array(this.fi_1);
    tmp_4 = tmp_4 + 1 | 0;
  }
  tmp_3.oi_1 = tmp_6;
  var tmp_7 = this;
  var tmp_8 = 0;
  var tmp_9 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_10 = Array(tmp_9);
  while (tmp_8 < tmp_9) {
    tmp_10[tmp_8] = new Float32Array(this.fi_1);
    tmp_8 = tmp_8 + 1 | 0;
  }
  tmp_7.pi_1 = tmp_10;
  var tmp_11 = this;
  var tmp_12 = 0;
  var tmp_13 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_14 = Array(tmp_13);
  while (tmp_12 < tmp_13) {
    tmp_14[tmp_12] = new Float32Array(this.fi_1);
    tmp_12 = tmp_12 + 1 | 0;
  }
  tmp_11.qi_1 = tmp_14;
  var tmp_15 = this;
  var tmp_16 = 0;
  var tmp_17 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_18 = Array(tmp_17);
  while (tmp_16 < tmp_17) {
    tmp_18[tmp_16] = new Float32Array(256);
    tmp_16 = tmp_16 + 1 | 0;
  }
  tmp_15.ri_1 = tmp_18;
  var tmp_19 = this;
  var tmp_20 = 0;
  var tmp_21 = this.yh_1;
  // Inline function 'kotlin.arrayOfNulls' call
  var tmp_22 = Array(tmp_21);
  while (tmp_20 < tmp_21) {
    tmp_22[tmp_20] = new Float32Array(768);
    tmp_20 = tmp_20 + 1 | 0;
  }
  tmp_19.si_1 = tmp_22;
  this.ti_1 = new Float32Array(256);
  this.ui_1 = new Float32Array(this.fi_1);
  this.vi_1 = new Float32Array(this.fi_1);
  this.wi_1 = new Float32Array(this.fi_1);
  this.xi_1 = new Float32Array(this.fi_1);
  var tmp_23 = this;
  var tmp_24 = 0;
  var tmp_25 = this.gi_1;
  var tmp_26 = new Float32Array(tmp_25);
  while (tmp_24 < tmp_25) {
    tmp_26[tmp_24] = 5.0;
    tmp_24 = tmp_24 + 1 | 0;
  }
  tmp_23.yi_1 = tmp_26;
  this.zi_1 = new Float32Array(this.gi_1);
  this.aj_1 = new Float32Array(this.gi_1);
  var tmp_27 = this;
  var tmp_28 = 0;
  var tmp_29 = this.yh_1;
  var tmp_30 = new Float32Array(tmp_29);
  while (tmp_28 < tmp_29) {
    var tmp_31 = tmp_28;
    tmp_30[tmp_31] = this.wh_1.m(tmp_31).qh_1;
    tmp_28 = tmp_28 + 1 | 0;
  }
  tmp_27.bj_1 = tmp_30;
  this.cj_1 = new Float32Array(this.yh_1);
  this.dj_1 = 0.0;
  this.ej_1 = 0.0;
  this.fj_1 = 0.0;
  this.gj_1 = -2147483648;
  this.hj_1 = 1.0;
  this.ij_1 = 0.0;
  this.jj_1 = 0.0;
  this.kj_1 = 0.0;
  // Inline function 'kotlin.collections.sumOf' call
  var sum = 0;
  var _iterator__ex2g4s = this.xh_1.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    var tmp_32 = sum;
    sum = tmp_32 + element.jh_1;
  }
  var total = sum;
  var r = 0;
  var start = 0.0;
  var inductionVariable = 0;
  var last = this.ei_1;
  if (inductionVariable <= last)
    do {
      var j = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var t = j / this.ei_1 * total;
      while (r < (this.gi_1 - 1 | 0) && t >= start + this.xh_1.m(r).jh_1) {
        start = start + this.xh_1.m(r).jh_1;
        r = r + 1 | 0;
      }
      var within = coerceIn((t - start) / this.xh_1.m(r).jh_1, 0.0, 1.0);
      var from = displayBandAt(this.xh_1.m(r).hh_1);
      var to = displayBandAt(this.xh_1.m(r).ih_1);
      this.hi_1[j] = r;
      this.ii_1[j] = from + (to - from) * within;
      var rise = r === 0 ? coerceIn(within / 0.35, 0.0, 1.0) : 1.0;
      this.ji_1[j] = this.xh_1.m(r).mh_1 * (0.55 + (1.0 - 0.55) * rise * rise * (3.0 - 2.0 * rise));
      this.ki_1[j] = this.xh_1.m(r).kh_1;
      this.li_1[j] = this.xh_1.m(r).lh_1;
    }
     while (!(j === last));
}
protoOf(OrbGeometry).n7 = function () {
  var inductionVariable = 0;
  var last = this.yh_1;
  if (inductionVariable < last)
    do {
      var l = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      fill_0(this.ni_1[l], 0.0);
      fill_0(this.oi_1[l], 0.0);
      fill_0(this.pi_1[l], 0.0);
      this.bj_1[l] = this.wh_1.m(l).qh_1;
      this.cj_1[l] = 0.0;
    }
     while (inductionVariable < last);
  var inductionVariable_0 = 0;
  var last_0 = this.gi_1;
  if (inductionVariable_0 < last_0)
    do {
      var r = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      this.yi_1[r] = this.zh_1.uh_1;
      this.zi_1[r] = 0.0;
    }
     while (inductionVariable_0 < last_0);
  this.dj_1 = 0.0;
  this.ej_1 = 0.0;
  this.fj_1 = 0.0;
  this.hj_1 = 1.0;
  this.ij_1 = 0.0;
  this.jj_1 = 0.0;
  this.ai_1 = 0.0;
  this.bi_1 = 0.25;
};
protoOf(OrbGeometry).lj = function (dt, playing, bands, bandsVersion, side, cornerRadius, coverScale, phaseLevel, spike, volume, heavy, kick, pulse) {
  var tmp;
  if (dt > 0.0) {
    // Inline function 'kotlin.math.min' call
    tmp = Math.min(dt, 5.0);
  } else {
    tmp = 0.0;
  }
  var elapsed = tmp;
  var tmp_0 = this;
  // Inline function 'kotlin.math.min' call
  var a = this.hj_1 + elapsed;
  tmp_0.hj_1 = Math.min(a, 10.0);
  if (!(bandsVersion === this.gj_1)) {
    this.gj_1 = bandsVersion;
    if (playing) {
      listen(this, bands, coerceIn(this.hj_1, 0.001, 0.2));
    }
    this.hj_1 = 0.0;
  }
  var live = playing && this.hj_1 < 1.0;
  if (!live) {
    var inductionVariable = 0;
    var last = this.yh_1;
    if (inductionVariable < last)
      do {
        var l = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        fill_0(this.ni_1[l], 0.0);
      }
       while (inductionVariable < last);
    this.fj_1 = 0.0;
    this.dj_1 = 0.0;
  }
  // Inline function 'kotlin.math.min' call
  var step = Math.min(elapsed, 0.05);
  var tmp_1;
  if (step > 0.0) {
    // Inline function 'kotlin.math.ceil' call
    var x = step / 0.008333334 - 0.01;
    var tmp$ret$3 = Math.ceil(x);
    // Inline function 'kotlin.math.max' call
    var b = numberToInt(tmp$ret$3);
    tmp_1 = Math.max(1, b);
  } else {
    tmp_1 = 0;
  }
  var steps = tmp_1;
  var h = steps > 0 ? step / steps : 0.0;
  smoothLevels(this, steps, h);
  var tmp_2;
  if (live) {
    tmp_2 = coerceIn(sane(this, pulse == null ? kick : pulse), 0.0, 1.0);
  } else {
    tmp_2 = 0.0;
  }
  var pumpGoal = tmp_2;
  var pumpUp = rate(this, h, 0.05);
  var pumpDown = rate(this, h, 0.18);
  // Inline function 'kotlin.repeat' call
  var inductionVariable_0 = 0;
  if (inductionVariable_0 < steps)
    do {
      var index = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      this.ij_1 = this.ij_1 + (pumpGoal - this.ij_1) * (pumpGoal > this.ij_1 ? pumpUp : pumpDown);
    }
     while (inductionVariable_0 < steps);
  if (pumpGoal === 0.0 && this.ij_1 < 5.0E-4)
    this.ij_1 = 0.0;
  var phaseOpen = 0.35 + (1.0 - 0.35) * coerceIn((sane(this, phaseLevel) - 0.4) / 0.5, 0.0, 1.0);
  var loudOpen = coerceIn((this.fj_1 - 0.12) / 0.45, 0.0, 1.0);
  var openGoal = playing ? phaseOpen * loudOpen : 0.0;
  this.ai_1 = this.ai_1 + (openGoal - this.ai_1) * rate(this, step, openGoal > this.ai_1 ? 1.5 : 3.0);
  if (openGoal === 0.0 && this.ai_1 < 5.0E-4)
    this.ai_1 = 0.0;
  var bassGoal = coerceAtMost_0(this.dj_1 * 1.5, 1.0);
  this.jj_1 = this.jj_1 + (bassGoal - this.jj_1) * rate(this, step, bassGoal > this.jj_1 ? 0.08 : 0.35);
  this.bi_1 = coerceIn(0.25 + (1.0 - 0.25) * this.jj_1 * (0.3 + 0.7 * this.ai_1), 0.0, 1.0);
  var inductionVariable_1 = 0;
  var last_0 = this.yh_1;
  if (inductionVariable_1 < last_0)
    do {
      var l_0 = inductionVariable_1;
      inductionVariable_1 = inductionVariable_1 + 1 | 0;
      this.bj_1[l_0] = this.wh_1.m(l_0).qh_1 + (1.0 - this.wh_1.m(l_0).qh_1) * this.ai_1;
    }
     while (inductionVariable_1 < last_0);
  this.di_1 = (this.di_1 + elapsed / 50.0) % 1.0;
  shape_0(this, side, cornerRadius, coverScale, sane(this, spike), sane(this, volume), coerceIn(sane(this, heavy), 0.0, 1.0), step);
};
protoOf(OrbGeometry).mj = function (layer) {
  return this.ri_1[layer];
};
protoOf(OrbGeometry).nj = function (layer) {
  return this.si_1[layer];
};
protoOf(OrbGeometry).oj = function (layer) {
  return this.bj_1[layer];
};
function OrbSource_PCM_getInstance() {
  static_init_3();
  return OrbSource_PCM_instance;
}
var properties_initialized_OrbGeometry_kt_y663nl;
function _init_properties_OrbGeometry_kt__mo1801() {
  if (!properties_initialized_OrbGeometry_kt_y663nl) {
    properties_initialized_OrbGeometry_kt_y663nl = true;
    ORB_BANDS = listOf_0([new OrbBandSpec(45.0, 120.0, 0.24, 0.065, 0.25, 1.0), new OrbBandSpec(120.0, 500.0, 0.28, 0.055, 0.22, 0.8), new OrbBandSpec(500.0, 2500.0, 0.27, 0.045, 0.19, 0.6), new OrbBandSpec(2500.0, 10000.0, 0.21, 0.04, 0.16, 0.45)]);
    ORB_LAYERS = listOf_0([new OrbLayerSpec(1.0, 0, 1.0, 0.55), new OrbLayerSpec(1.7, 3, 1.22, 0.3), new OrbLayerSpec(2.8, 7, 1.42, 0.15)]);
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
  return toByte(coerceIn_0(tmp$ret$0, -128, 127));
}
function PcmFft(size) {
  this.pj_1 = size;
  this.qj_1 = this.pj_1 / 2 | 0;
  var tmp = this;
  var tmp_0 = 0;
  var tmp_1 = this.pj_1;
  var tmp_2 = new Float32Array(tmp_1);
  while (tmp_0 < tmp_1) {
    var tmp_3 = tmp_0;
    // Inline function 'kotlin.math.cos' call
    var x = 2.0 * 3.141592653589793 * tmp_3 / (this.pj_1 - 1 | 0);
    tmp_2[tmp_3] = 0.5 - 0.5 * Math.cos(x);
    tmp_0 = tmp_0 + 1 | 0;
  }
  tmp.rj_1 = tmp_2;
  this.sj_1 = new Float32Array(this.pj_1);
  this.tj_1 = new Float32Array(this.pj_1);
  this.uj_1 = new Float32Array(this.pj_1);
  this.vj_1 = new Int8Array(this.pj_1);
  this.wj_1 = 1.0;
}
protoOf(PcmFft).xj = function (samples, rateHz) {
  var tmp0 = this.sj_1;
  var tmp2 = this.sj_1;
  var tmp6 = this.qj_1;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex = this.pj_1;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp = tmp0;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  arrayCopy(tmp, tmp2, 0, tmp6, endIndex);
  var inductionVariable = 0;
  var last = this.qj_1;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      this.sj_1[(this.pj_1 - this.qj_1 | 0) + i | 0] = samples[i];
    }
     while (inductionVariable < last);
  var inductionVariable_0 = 0;
  var last_0 = this.pj_1;
  if (inductionVariable_0 < last_0)
    do {
      var i_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      this.tj_1[i_0] = this.sj_1[i_0] * this.rj_1[i_0];
      this.uj_1[i_0] = 0.0;
    }
     while (inductionVariable_0 < last_0);
  fft(this, this.tj_1, this.uj_1);
  var frameMax = 0.0;
  var inductionVariable_1 = 1;
  var last_1 = this.pj_1 / 2 | 0;
  if (inductionVariable_1 < last_1)
    do {
      var k = inductionVariable_1;
      inductionVariable_1 = inductionVariable_1 + 1 | 0;
      var tmp0_0 = frameMax;
      var tmp0_1 = this.tj_1[k];
      // Inline function 'kotlin.math.hypot' call
      var y = this.uj_1[k];
      // Inline function 'kotlin.math.max' call
      var b = hypot(tmp0_1, y);
      frameMax = Math.max(tmp0_0, b);
    }
     while (inductionVariable_1 < last_1);
  var tmp_0 = this;
  var tmp0_2 = frameMax;
  var tmp_1 = this.wj_1;
  // Inline function 'kotlin.math.exp' call
  var x = -(this.qj_1 / rateHz) / 30.0;
  // Inline function 'kotlin.math.max' call
  var b_0 = tmp_1 * Math.exp(x);
  // Inline function 'kotlin.math.max' call
  var b_1 = Math.max(0.001, b_0);
  tmp_0.wj_1 = Math.max(tmp0_2, b_1);
  var scale = 100.0 / this.wj_1;
  this.vj_1[0] = push$b(scale, this.tj_1[0]);
  this.vj_1[1] = push$b(scale, this.tj_1[this.pj_1 / 2 | 0]);
  var inductionVariable_2 = 1;
  var last_2 = this.pj_1 / 2 | 0;
  if (inductionVariable_2 < last_2)
    do {
      var k_0 = inductionVariable_2;
      inductionVariable_2 = inductionVariable_2 + 1 | 0;
      this.vj_1[imul_0(2, k_0)] = push$b(scale, this.tj_1[k_0]);
      this.vj_1[imul_0(2, k_0) + 1 | 0] = push$b(scale, this.uj_1[k_0]);
    }
     while (inductionVariable_2 < last_2);
  // Inline function 'kotlin.collections.copyOf' call
  // Inline function 'kotlin.js.asDynamic' call
  return this.vj_1.slice();
};
function RaveLog$sink$lambda(_unused_var__etf5q3, _unused_var__etf5q3_0) {
  return Unit_instance;
}
function RaveLog() {
  RaveLog_instance = this;
  var tmp = this;
  tmp.qa_1 = RaveLog$sink$lambda;
}
protoOf(RaveLog).ra = function (tag, message) {
  return this.qa_1(tag, message);
};
var RaveLog_instance;
function RaveLog_getInstance() {
  if (RaveLog_instance == null)
    new RaveLog();
  return RaveLog_instance;
}
function volumeGain(volume) {
  // Inline function 'kotlin.math.pow' call
  var this_0 = coerceIn(volume, 0.0, 1.0);
  return 0.35 + 0.65 * Math.pow(this_0, 1.5);
}
function maxVolumeBoost(volume) {
  return 1.0 + (1.0 / 0.7 - 1.0) * coerceIn((volume - 0.9) / 0.1, 0.0, 1.0);
}
function loudRamp(volume) {
  return coerceIn((volume - 0.7) / 0.3, 0.0, 1.0);
}
function loudness(volume) {
  return coerceIn((volume - 0.75) / 0.25, 0.0, 1.0);
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
  this.yj_1 = kick;
  this.zj_1 = spike;
  this.ak_1 = particles;
  this.bk_1 = shake;
  this.ck_1 = strobe;
  this.dk_1 = swayX;
  this.ek_1 = swayRot;
  this.fk_1 = bounceY;
  this.gk_1 = warmth;
}
protoOf(GenreLook).toString = function () {
  return 'GenreLook(kick=' + this.yj_1 + ', spike=' + this.zj_1 + ', particles=' + this.ak_1 + ', shake=' + this.bk_1 + ', strobe=' + this.ck_1 + ', swayX=' + this.dk_1 + ', swayRot=' + this.ek_1 + ', bounceY=' + this.fk_1 + ', warmth=' + this.gk_1 + ')';
};
protoOf(GenreLook).hashCode = function () {
  var result = this.yj_1 == null ? 0 : getNumberHashCode(this.yj_1);
  result = imul_0(result, 31) + getNumberHashCode(this.zj_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ak_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.bk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ck_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.dk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.ek_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.fk_1) | 0;
  result = imul_0(result, 31) + getNumberHashCode(this.gk_1) | 0;
  return result;
};
protoOf(GenreLook).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof GenreLook))
    return false;
  if (!equals(this.yj_1, other.yj_1))
    return false;
  if (!equals(this.zj_1, other.zj_1))
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
  return true;
};
function GenreRules() {
  this.hk_1 = 0.25;
}
protoOf(GenreRules).ik = function (f, now) {
  var p = f.p8_1;
  if (p <= 0.0 || compare(f.o8_1, new Long(0, 0)) <= 0 || toNumber(subtract(now, f.o8_1)) > p * 2.0)
    return null;
  // Inline function 'kotlin.Long.div' call
  var this_0 = subtract(now, f.o8_1);
  return (toNumber(this_0) / p % 1.0 + 1.0) % 1.0;
};
protoOf(GenreRules).jk = function (f, now) {
  var tmp0_safe_receiver = this.ik(f, now);
  var tmp;
  if (tmp0_safe_receiver == null) {
    tmp = null;
  } else {
    // Inline function 'kotlin.let' call
    tmp = ((f.n8_1 % 2 | 0) + tmp0_safe_receiver) / 2.0;
  }
  return tmp;
};
protoOf(GenreRules).kk = function (genre, edm, f, halfPulse, fullPulse, now) {
  var tmp;
  switch (genre.y_1) {
    case 1:
      var strong = coerceIn((f.t7_1 - 0.55) / 0.3, 0.0, 1.0) * coerceAtMost_0(0.5 + f.g8_1, 1.0);
      tmp = new GenreLook((halfPulse == null ? f.u7_1 : halfPulse) * strong, VOID, 1.0 + 0.6 * f.a8_1, VOID, 0.0);
      break;
    case 6:
      var ph = this.jk(f, now);
      var tmp_0;
      if (ph == null) {
        tmp_0 = 0.0;
      } else {
        // Inline function 'kotlin.math.sin' call
        var x = 2.0 * 3.141592653589793 * ph;
        tmp_0 = Math.sin(x) * (0.6 + 0.4 * coerceIn(f.t8_1, 0.0, 1.0));
      }

      var s = tmp_0;
      var tmp2_swayRot = 0.5 * s;
      tmp = new GenreLook(VOID, VOID, VOID, 0.0, 0.0, s, tmp2_swayRot, VOID, 1.0);
      break;
    case 7:
      var ph_0 = this.jk(f, now);
      var tmp4_bounceY = fullPulse == null ? f.u7_1 : fullPulse;
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
      tmp = edm == null ? new GenreLook() : new GenreLook(edm.ok_1 ? halfPulse : null, edm.rk_1, edm.pk_1, edm.qk_1, edm.sk_1);
      break;
    default:
      tmp = new GenreLook();
      break;
  }
  return tmp;
};
protoOf(GenreRules).tk = function (strength) {
  return 0.4 + 1.2 * coerceIn(strength, 0.0, 1.0);
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
  return tmp.o4(_this__u8e3s4, fmt$lambda(args, i));
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
    var plus = m.j5().m(1) === '+';
    var digits = toIntOrNull(m.j5().m(2));
    var tmp;
    switch (m.j5().m(3)) {
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
  var tmp0_elvis_lhs = $this.ol_1;
  return tmp0_elvis_lhs == null ? 0.5 : tmp0_elvis_lhs;
}
function tick$blend(mix, a, b) {
  return a + (b - a) * mix;
}
function tick$subMul(hsW, x) {
  return 1.0 + (x - 1.0) * hsW;
}
function tick$eased(dt, from, goal, attackS, releaseS) {
  var tmp = goal - from;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / (goal > from ? attackS : releaseS);
  return from + tmp * (1.0 - Math.exp(x));
}
function WebPartyEngine(fftSize) {
  fftSize = fftSize === VOID ? 2048 : fftSize;
  this.uk_1 = new PcmFft(fftSize);
  this.vk_1 = new HardstyleAudio();
  this.wk_1 = new GenreDetector();
  this.xk_1 = new HardstyleStructure();
  this.yk_1 = new HardSubDetector();
  this.zk_1 = new BeatClock();
  this.al_1 = new BeatClock();
  this.bl_1 = new FlashBudget();
  this.cl_1 = Random_0(7);
  this.dl_1 = new HardstyleFrame();
  this.el_1 = new Long(0, 0);
  this.fl_1 = new HardstyleFrame();
  this.gl_1 = new Float32Array(48);
  this.hl_1 = 0.0;
  this.il_1 = new OrbGeometry();
  this.jl_1 = new Float32Array(96);
  this.kl_1 = 0.0;
  this.ll_1 = 0.0;
  this.ml_1 = 0.0;
  this.nl_1 = 1.0;
  this.ol_1 = null;
  this.pl_1 = null;
  this.ql_1 = HardSub_RAW_getInstance();
  this.rl_1 = 0.0;
  this.sl_1 = SongPart_INTRO_getInstance();
  this.tl_1 = new Long(0, 0);
  this.ul_1 = false;
  this.vl_1 = new Long(-10000, -1);
  this.wl_1 = new Long(-10000, -1);
  this.xl_1 = 0;
  this.genre = 'HARDSTYLE';
  this.genreLabel = Genre_HARDSTYLE_getInstance().c9_1;
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
  this.dropOn = false;
  this.particleDrift = 1.0;
  this.edgeGlow = 0.0;
  this.yl_1 = 0.0;
  this.hearing = false;
  this.coverScale = 1.0;
}
protoOf(WebPartyEngine).zl = function () {
  return this.uk_1.qj_1;
};
protoOf(WebPartyEngine).am = function () {
  return this.genre;
};
protoOf(WebPartyEngine).bm = function () {
  return this.genreLabel;
};
protoOf(WebPartyEngine).cm = function () {
  return this.genreAnnouncedAt;
};
protoOf(WebPartyEngine).dm = function () {
  return this.partName;
};
protoOf(WebPartyEngine).em = function () {
  return this.partLabel;
};
protoOf(WebPartyEngine).fm = function () {
  return this.partLabelAt;
};
protoOf(WebPartyEngine).gm = function () {
  return this.vibe;
};
protoOf(WebPartyEngine).hm = function () {
  return this.vibeLive;
};
protoOf(WebPartyEngine).im = function () {
  return this.vibeAuto;
};
protoOf(WebPartyEngine).jm = function () {
  return this.rockness;
};
protoOf(WebPartyEngine).km = function () {
  return this.phaseLevel;
};
protoOf(WebPartyEngine).lm = function () {
  return this.visualTime;
};
protoOf(WebPartyEngine).mm = function () {
  return this.audioIntensity;
};
protoOf(WebPartyEngine).nm = function () {
  return this.dropLook;
};
protoOf(WebPartyEngine).om = function () {
  return this.warmth;
};
protoOf(WebPartyEngine).pm = function () {
  return this.dip;
};
protoOf(WebPartyEngine).qm = function () {
  return this.dropHit;
};
protoOf(WebPartyEngine).rm = function () {
  return this.breath;
};
protoOf(WebPartyEngine).sm = function () {
  return this.grade;
};
protoOf(WebPartyEngine).tm = function () {
  return this.shakeX;
};
protoOf(WebPartyEngine).um = function () {
  return this.shakeY;
};
protoOf(WebPartyEngine).vm = function () {
  return this.shakeRotation;
};
protoOf(WebPartyEngine).wm = function () {
  return this.bounceY;
};
protoOf(WebPartyEngine).xm = function () {
  return this.aberration;
};
protoOf(WebPartyEngine).ym = function () {
  return this.strobe;
};
protoOf(WebPartyEngine).zm = function () {
  return this.strobeColor;
};
protoOf(WebPartyEngine).an = function () {
  return this.heavyFlash;
};
protoOf(WebPartyEngine).bn = function () {
  return this.partyHit;
};
protoOf(WebPartyEngine).cn = function () {
  return this.subGlow;
};
protoOf(WebPartyEngine).dn = function () {
  return this.screechTint;
};
protoOf(WebPartyEngine).en = function () {
  return this.flashesPerSecond;
};
protoOf(WebPartyEngine).fn = function () {
  return this.spike;
};
protoOf(WebPartyEngine).gn = function () {
  return this.particles;
};
protoOf(WebPartyEngine).hn = function () {
  return this.shakeAmount;
};
protoOf(WebPartyEngine).in = function () {
  return this.strobeAmount;
};
protoOf(WebPartyEngine).jn = function () {
  return this.density;
};
protoOf(WebPartyEngine).kn = function () {
  return this.softness;
};
protoOf(WebPartyEngine).ln = function () {
  return this.dropOn;
};
protoOf(WebPartyEngine).mn = function () {
  return this.particleDrift;
};
protoOf(WebPartyEngine).nn = function () {
  return 60;
};
protoOf(WebPartyEngine).on = function () {
  return 120;
};
protoOf(WebPartyEngine).pn = function () {
  return 400;
};
protoOf(WebPartyEngine).qn = function () {
  return this.edgeGlow;
};
protoOf(WebPartyEngine).rn = function () {
  return 0.03;
};
protoOf(WebPartyEngine).sn = function () {
  return 32.0;
};
protoOf(WebPartyEngine).tn = function () {
  return 3.4;
};
protoOf(WebPartyEngine).un = function () {
  return 2.5;
};
protoOf(WebPartyEngine).vn = function () {
  return 0.12;
};
protoOf(WebPartyEngine).wn = function () {
  return 0.3;
};
protoOf(WebPartyEngine).xn = function () {
  return 0.1;
};
protoOf(WebPartyEngine).yn = function () {
  return 0.3;
};
protoOf(WebPartyEngine).zn = function () {
  return 40.0;
};
protoOf(WebPartyEngine).ao = function () {
  return 24.0;
};
protoOf(WebPartyEngine).bo = function () {
  return 0.42;
};
protoOf(WebPartyEngine).co = function () {
  return 4.0;
};
protoOf(WebPartyEngine).do = function () {
  return 16.0;
};
protoOf(WebPartyEngine).eo = function () {
  return 7;
};
protoOf(WebPartyEngine).fo = function () {
  return 3;
};
protoOf(WebPartyEngine).go = function () {
  return 0.3;
};
protoOf(WebPartyEngine).ho = function () {
  return 0.35;
};
protoOf(WebPartyEngine).io = function () {
  return 0.6;
};
protoOf(WebPartyEngine).jo = function () {
  return 0.09;
};
protoOf(WebPartyEngine).ko = function () {
  return 0.45;
};
protoOf(WebPartyEngine).lo = function () {
  return 0.3;
};
protoOf(WebPartyEngine).mo = function () {
  return 1900;
};
protoOf(WebPartyEngine).no = function () {
  return 0.75;
};
protoOf(WebPartyEngine).oo = function () {
  return 0.1;
};
protoOf(WebPartyEngine).po = function () {
  return 0.42;
};
protoOf(WebPartyEngine).qo = function () {
  return 0.34;
};
protoOf(WebPartyEngine).ro = function () {
  return 0.6;
};
protoOf(WebPartyEngine).so = function () {
  return 0.5;
};
protoOf(WebPartyEngine).to = function () {
  return 0.72;
};
protoOf(WebPartyEngine).uo = function () {
  return 1.2;
};
protoOf(WebPartyEngine).vo = function () {
  return 0.96;
};
protoOf(WebPartyEngine).wo = function () {
  return 1.25;
};
protoOf(WebPartyEngine).xo = function () {
  return 12.0;
};
protoOf(WebPartyEngine).yo = function () {
  return 1.2;
};
protoOf(WebPartyEngine).zo = function () {
  return 0.22;
};
protoOf(WebPartyEngine).ap = function () {
  return 0.85;
};
protoOf(WebPartyEngine).bp = function () {
  return 0.3;
};
protoOf(WebPartyEngine).cp = function () {
  return 0.17;
};
protoOf(WebPartyEngine).dp = function () {
  return 0.7;
};
protoOf(WebPartyEngine).ep = function () {
  return 0.35;
};
protoOf(WebPartyEngine).fp = function () {
  return 0.3;
};
protoOf(WebPartyEngine).gp = function () {
  return 0.45;
};
protoOf(WebPartyEngine).hp = function () {
  return 8;
};
protoOf(WebPartyEngine).ip = function () {
  return 0.72;
};
protoOf(WebPartyEngine).jp = function () {
  return 0.35;
};
protoOf(WebPartyEngine).kp = function () {
  return 0.5;
};
protoOf(WebPartyEngine).lp = function () {
  return 0.04;
};
protoOf(WebPartyEngine).mp = function () {
  return 2.2;
};
protoOf(WebPartyEngine).np = function () {
  return 7.0;
};
protoOf(WebPartyEngine).op = function () {
  return 3.0;
};
protoOf(WebPartyEngine).pp = function () {
  return 9;
};
protoOf(WebPartyEngine).qp = function () {
  return 0.25;
};
protoOf(WebPartyEngine).rp = function () {
  return 9.0;
};
protoOf(WebPartyEngine).sp = function () {
  return 1.0;
};
protoOf(WebPartyEngine).tp = function () {
  return 0.9;
};
protoOf(WebPartyEngine).auraLayerAlpha = function (layer) {
  return auraLayerAlpha(layer);
};
protoOf(WebPartyEngine).auraLayerColorShift = function (layer) {
  return auraLayerColorShift(layer);
};
protoOf(WebPartyEngine).auraLayerDrift = function (layer) {
  return auraLayerDrift(layer);
};
protoOf(WebPartyEngine).up = function () {
  return 2;
};
protoOf(WebPartyEngine).vp = function () {
  return 11.0;
};
protoOf(WebPartyEngine).wp = function () {
  return 16775404;
};
protoOf(WebPartyEngine).xp = function () {
  return 0.22;
};
protoOf(WebPartyEngine).yp = function () {
  return 0.33;
};
protoOf(WebPartyEngine).zp = function () {
  return 56;
};
protoOf(WebPartyEngine).aq = function () {
  return 1.3;
};
protoOf(WebPartyEngine).bq = function () {
  return 9.0;
};
protoOf(WebPartyEngine).cq = function () {
  return 2.5;
};
protoOf(WebPartyEngine).dq = function () {
  return 1;
};
protoOf(WebPartyEngine).eq = function () {
  return 0.2;
};
protoOf(WebPartyEngine).fq = function () {
  return 0.25;
};
protoOf(WebPartyEngine).gq = function () {
  return 0;
};
protoOf(WebPartyEngine).hq = function () {
  return 0.45;
};
protoOf(WebPartyEngine).iq = function () {
  return 0.25;
};
protoOf(WebPartyEngine).jq = function () {
  return 0.6;
};
protoOf(WebPartyEngine).kq = function () {
  return 4.0;
};
protoOf(WebPartyEngine).lq = function () {
  return 0.75499994;
};
protoOf(WebPartyEngine).mq = function () {
  return this.hearing;
};
protoOf(WebPartyEngine).nq = function () {
  return this.fl_1.t7_1;
};
protoOf(WebPartyEngine).oq = function () {
  return this.fl_1.u7_1;
};
protoOf(WebPartyEngine).pq = function () {
  return this.fl_1.v7_1;
};
protoOf(WebPartyEngine).qq = function () {
  return this.fl_1.w7_1;
};
protoOf(WebPartyEngine).rq = function () {
  return this.fl_1.x7_1;
};
protoOf(WebPartyEngine).sq = function () {
  return this.fl_1.y7_1;
};
protoOf(WebPartyEngine).tq = function () {
  return this.fl_1.a8_1;
};
protoOf(WebPartyEngine).uq = function () {
  return this.fl_1.b8_1;
};
protoOf(WebPartyEngine).vq = function () {
  return this.fl_1.c8_1;
};
protoOf(WebPartyEngine).wq = function () {
  return this.fl_1.e8_1;
};
protoOf(WebPartyEngine).xq = function () {
  return this.fl_1.f8_1;
};
protoOf(WebPartyEngine).yq = function () {
  return this.fl_1.g8_1;
};
protoOf(WebPartyEngine).zq = function () {
  return this.fl_1.i8_1;
};
protoOf(WebPartyEngine).ar = function () {
  return this.fl_1.u8_1;
};
protoOf(WebPartyEngine).br = function () {
  return this.fl_1.v8_1;
};
protoOf(WebPartyEngine).cr = function () {
  return this.fl_1.d8_1;
};
protoOf(WebPartyEngine).dr = function () {
  return this.gl_1;
};
protoOf(WebPartyEngine).er = function () {
  return this.coverScale;
};
protoOf(WebPartyEngine).fr = function () {
  return this.il_1.yh_1;
};
protoOf(WebPartyEngine).gr = function () {
  return this.il_1.ai_1;
};
protoOf(WebPartyEngine).hr = function () {
  return this.il_1.bi_1;
};
protoOf(WebPartyEngine).setOrbSize = function (side, cornerRadius) {
  this.kl_1 = side;
  this.ll_1 = cornerRadius;
};
protoOf(WebPartyEngine).orbPoints = function (layer) {
  return this.il_1.mj(layer);
};
protoOf(WebPartyEngine).orbCurves = function (layer) {
  return this.il_1.nj(layer);
};
protoOf(WebPartyEngine).orbAlpha = function (layer) {
  return this.il_1.oj(layer);
};
protoOf(WebPartyEngine).ir = function () {
  return this.il_1.di_1;
};
protoOf(WebPartyEngine).pushPcm = function (samples, rateHz, nowMs) {
  var now = numberToLong(nowMs);
  var fft = this.uk_1.xj(samples, rateHz);
  this.dl_1 = this.vk_1.dh(fft, rateHz, now);
  this.el_1 = now;
  return fft;
};
protoOf(WebPartyEngine).newTrack = function (nowMs) {
  var now = numberToLong(nowMs);
  this.vk_1.n7();
  this.il_1.n7();
  this.ml_1 = 0.0;
  this.dl_1 = new HardstyleFrame();
  this.wk_1.ta(now);
  this.xk_1.ta(now);
  this.yk_1.hf();
  this.rl_1 = 0.0;
  this.zk_1.n7();
  this.al_1.n7();
  this.dip = 0.0;
  this.dropHit = 0.0;
  this.sl_1 = SongPart_INTRO_getInstance();
  this.dropLook = 0;
  this.tl_1 = new Long(0, 0);
  this.ul_1 = false;
};
protoOf(WebPartyEngine).setMetadata = function (appleGenre, appleExact, deezerGenres, nowMs) {
  this.wk_1.ua(appleGenre, appleExact, toList_0(deezerGenres), null, numberToLong(nowMs));
  this.genre = this.wk_1.k9_1.x_1;
};
protoOf(WebPartyEngine).setStrength = function (value) {
  var tmp = this;
  tmp.ol_1 = value == null ? null : coerceIn(value, 0.0, 1.0);
};
protoOf(WebPartyEngine).tick = function (nowMs, dtS, playing, positionMs, durationMs, volume) {
  var now = numberToLong(nowMs);
  var dt = coerceIn(dtS, 0.0, 0.05);
  var fresh = compare(subtract(now, this.el_1), new Long(300, 0)) < 0;
  this.hearing = fresh;
  var rawTarget = playing && fresh ? this.dl_1 : new HardstyleFrame();
  var pos = numberToLong(positionMs);
  var dur = durationMs > 0 ? numberToLong(durationMs) : new Long(-1, -1);
  var tmp0_elvis_lhs = maxOrNull_0(rawTarget.z7_1);
  var activity = maxOf(rawTarget.t7_1, new Float32Array([rawTarget.u7_1, rawTarget.v7_1, rawTarget.a8_1, tmp0_elvis_lhs == null ? 0.0 : tmp0_elvis_lhs]));
  if (playing && activity > 0.025)
    this.visualTime = this.visualTime + dt * (0.35 + activity);
  this.audioIntensity = playing && activity > 0.025 ? coerceIn(activity, 0.0, 1.0) : 0.0;
  // Inline function 'kotlin.math.exp' call
  var x = -dt / (playing ? 0.025 : 0.12);
  var mix = 1.0 - Math.exp(x);
  var g = playing && fresh ? this.wk_1.va(rawTarget, now) : this.wk_1.k9_1;
  this.genre = g.x_1;
  this.genreAnnouncedAt = toNumber(this.wk_1.n9_1);
  var tmp = this;
  // Inline function 'kotlin.math.round' call
  var x_0 = this.wk_1.pa_1 * 100.0;
  tmp.rockness = round(x_0) / 100.0;
  this.vibeAuto = this.ol_1 == null;
  var vibeGoal = this.wk_1.sa() ? 1.0 : vibeTarget(g);
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
    this.zk_1.n7();
    this.al_1.n7();
  }
  var clockOn = v >= 0.4;
  var clockPulse = playing && fresh ? this.zk_1.w8(rawTarget, now, 70.0) : null;
  var clockKick = clockOn ? clockPulse : null;
  var halfPulse = playing && fresh ? this.al_1.s7(rawTarget, now, 70.0, true, 350.0) : null;
  var look = GenreRules_instance.kk(g, this.pl_1, rawTarget, halfPulse, clockPulse, now);
  var strengthMul = GenreRules_instance.tk(_get_strength__jhduay(this));
  var clocked = !(clockKick == null) ? rawTarget.j9(VOID, clockKick) : rawTarget;
  var visualInput = this.xk_1.xb_1.equals(SongPart_BUILDUP_getInstance()) ? clocked.j9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, clocked.e8_1 * 0.3) : clocked;
  var shapedFull = vibeShape(visualInput, v, r);
  var phaseIntensity = playing && fresh ? this.xk_1.ke(rawTarget, now, pos, dur) : 1.0;
  this.partName = this.xk_1.xb_1.x_1;
  this.partLabel = this.xk_1.zb_1;
  this.partLabelAt = toNumber(this.xk_1.ac_1);
  if (playing && fresh && hardW > 0.0)
    this.ql_1 = this.yk_1.va(rawTarget, now);
  var tmp_4 = this;
  var tmp_5;
  switch (g.y_1) {
    case 0:
      tmp_5 = this.rockness >= 0.5 ? 'ROCK' : 'HARDSTYLE \xB7 ' + this.ql_1.ne_1;
      break;
    case 3:
      var tmp2_safe_receiver = this.pl_1;
      var tmp_6;
      if (tmp2_safe_receiver == null) {
        tmp_6 = null;
      } else {
        // Inline function 'kotlin.let' call
        tmp_6 = 'EDM \xB7 ' + tmp2_safe_receiver.nk_1;
      }

      var tmp3_elvis_lhs = tmp_6;
      tmp_5 = tmp3_elvis_lhs == null ? 'EDM' : tmp3_elvis_lhs;
      break;
    default:
      tmp_5 = g.c9_1;
      break;
  }
  tmp_4.genreLabel = tmp_5;
  var sw = structureWeight(v) * (1.0 - hardW * r);
  var heldOnPurpose = this.xk_1.xb_1.equals(SongPart_DROP_getInstance()) || this.xk_1.xb_1.equals(SongPart_BUILDUP_getInstance()) || this.xk_1.xb_1.equals(SongPart_BREAKDOWN_getInstance()) || this.xk_1.xb_1.equals(SongPart_ANTI_CLIMAX_getInstance());
  if (!playing || heldOnPurpose || rawTarget.w7_1 < 0.3)
    this.rl_1 = 0.0;
  else if (rawTarget.w7_1 > 0.55)
    this.rl_1 = this.rl_1 + dt;
  var missedDrop = coerceIn((this.rl_1 - 20.0) / 10.0, 0.0, 1.0);
  var remainingMs = compare(dur, new Long(0, 0)) > 0 ? subtract(dur, pos) : new Long(-1, -1);
  var outroFade = (compare(new Long(0, 0), remainingMs) <= 0 ? compare(remainingMs, new Long(20000, 0)) < 0 : false) ? 0.3 + (1.0 - 0.3) * (toNumber(remainingMs) / toNumber(new Long(20000, 0))) : 1.0;
  var tmp0 = 1.0 + (phaseIntensity - 1.0) * sw;
  // Inline function 'kotlin.math.max' call
  var b = 0.9 * missedDrop;
  var pi = Math.max(tmp0, b) * outroFade;
  var inDrop = sw > 0.0 && this.xk_1.xb_1.equals(SongPart_DROP_getInstance());
  var effectsOn = sw <= 0.5 || this.xk_1.ie() || missedDrop >= 1.0;
  var hsW = hardW * (1.0 - r);
  var sub = this.ql_1;
  this.phaseLevel = coerceAtMost_0(pi, 1.0);
  var live = !playing ? 0.0 : coerceIn(sw * coerceAtMost_0(pi, 1.0) + (1.0 - sw) * coerceIn(rawTarget.w7_1, 0.0, 1.0), 0.0, 1.0);
  var liveGoal = coerceIn(_get_strength__jhduay(this) * (0.35 + 0.65 * live), 0.0, 1.0);
  var tmp_7 = this;
  var tmp_8 = this.vibeLive;
  var tmp_9 = liveGoal - this.vibeLive;
  // Inline function 'kotlin.math.exp' call
  var x_3 = -dt / 0.35;
  // Inline function 'kotlin.math.round' call
  var x_4 = (tmp_8 + tmp_9 * (1.0 - Math.exp(x_3))) * 200.0;
  tmp_7.vibeLive = round(x_4) / 200.0;
  var screechShake = hsW * (this.xk_1.xb_1.equals(SongPart_DROP_getInstance()) && effectsOn ? sub.se_1 * (this.xk_1.yb_1.equals(DropKind_LAST_getInstance()) ? 1.3 : 1.0) : this.xk_1.xb_1.equals(SongPart_DROP_getInstance()) ? 0.5 * sub.se_1 : 0.0);
  var tmp_10;
  if (sw <= 0.0) {
    tmp_10 = shapedFull;
  } else if (inDrop) {
    var tmp0_0 = shapedFull.b8_1 * pi;
    // Inline function 'kotlin.math.max' call
    var b_0 = effectsOn ? 0.35 * sw * coerceAtMost_0(pi, 1.0) : 0.0;
    var tmp$ret$9 = Math.max(tmp0_0, b_0);
    tmp_10 = shapedFull.j9(VOID, VOID, VOID, VOID, VOID, VOID, VOID, VOID, coerceAtMost_0(tmp$ret$9, 1.0), effectsOn ? shapedFull.c8_1 : 0.0);
  } else {
    var tmp4_heavy = coerceAtMost_0(shapedFull.b8_1 * pi, 1.0);
    var tmp5_kick = shapedFull.u7_1 * (0.6 + 0.4 * coerceAtMost_0(pi, 1.0));
    var tmp6_grit = missedDrop >= 1.0 ? shapedFull.c8_1 : shapedFull.c8_1 * (1.0 - sw);
    tmp_10 = shapedFull.j9(VOID, tmp5_kick, VOID, VOID, VOID, VOID, VOID, VOID, tmp4_heavy, tmp6_grit);
  }
  var shaped = tmp_10;
  var showW = structureWeight(v) * (1.0 - 0.7 * r * hardW);
  var hud = this.xk_1.bc_1;
  var part = this.xk_1.xb_1;
  var buildRise = part.equals(SongPart_BUILDUP_getInstance()) ? coerceIn(hud.ib_1, 0.0, 1.0) * showW : 0.0;
  var hadDip = this.dip > 0.3 || compare(this.tl_1, new Long(0, 0)) > 0 || this.ul_1;
  if (!part.equals(SongPart_BUILDUP_getInstance())) {
    this.tl_1 = new Long(0, 0);
    this.ul_1 = false;
  }
  var tmp_11;
  if (part.equals(SongPart_BUILDUP_getInstance()) && hud.fb_1 && !this.ul_1) {
    var tmp0_1 = this.xk_1.je() >= 1 && hud.db_1 === 8 ? 1.0 : 0.0;
    // Inline function 'kotlin.comparisons.maxOf' call
    var b_1 = coerceIn((hud.ib_1 - 0.75) / (1.0 - 0.75), 0.0, 1.0);
    tmp_11 = showW * Math.max(tmp0_1, b_1);
  } else {
    tmp_11 = 0.0;
  }
  var dipWanted = tmp_11;
  if (dipWanted > 0.3 && equalsLong(this.tl_1, new Long(0, 0)))
    this.tl_1 = now;
  if (compare(this.tl_1, new Long(0, 0)) > 0 && compare(subtract(now, this.tl_1), new Long(2500, 0)) > 0)
    this.ul_1 = true;
  var dipGoal = this.ul_1 ? 0.0 : dipWanted;
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
  if (part.equals(SongPart_DROP_getInstance()) && !this.sl_1.equals(SongPart_DROP_getInstance()) && showW > 0.3 && this.bl_1.y8(now))
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
  this.sl_1 = part;
  var inShowDrop = part.equals(SongPart_DROP_getInstance()) && showW > 0.0;
  this.dropLook = inShowDrop ? (hud.eb_1 + this.xk_1.je() | 0) % 3 | 0 : 0;
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
  this.flashesPerSecond = this.bl_1.z8(now);
  var tune = 1.0;
  var p = vibeProfile(v, r);
  this.spike = p.d9_1 * (0.75 + 0.25 * pi) * tick$subMul(hsW, sub.qe_1) * lookSpike * tune * look.zj_1 * strengthMul;
  this.particles = p.e9_1 * (0.6 + 0.4 * pi) * tick$subMul(hsW, sub.re_1) * (1.0 + 0.25 * buildRise) * lookParticles * tune * look.ak_1 * strengthMul;
  this.shakeAmount = p.f9_1 * pi * tick$subMul(hsW, sub.oe_1) * lookShake * tune * look.bk_1 * strengthMul;
  this.strobeAmount = p.g9_1 * (effectsOn && pi >= 0.9 ? 1.0 : 0.0) * tick$subMul(hsW, sub.pe_1) * look.ck_1 * (_get_strength__jhduay(this) < 0.25 ? 0.0 : 1.0);
  this.density = p.h9_1 * (1.0 + 0.2 * buildRise);
  this.dropOn = (playing && effectsOn && pi >= 0.9);
  this.particleDrift = this.dropOn ? 1.0 : 0.7;
  var tmp_20 = this;
  // Inline function 'kotlin.let' call
  var it_0 = p.i9_1;
  tmp_20.softness = it_0 <= 1.2 ? coerceAtMost_0(it_0, 1.15) : it_0;
  var popLift = g.equals(Genre_POP_getInstance()) || g.equals(Genre_REGGAE_getInstance()) || g.equals(Genre_REGGAETON_getInstance()) ? this.wk_1.t9_1 : 0.0;
  if (popLift > 0.0) {
    this.spike = this.spike * (1.0 + 0.35 * popLift);
    this.particles = this.particles * (1.0 + 0.4 * popLift);
  }
  var tmp_21;
  if (popLift > 0.0) {
    var tmp9_kick = coerceAtMost_0(shaped.u7_1 * (1.0 + 0.6 * popLift), 1.0);
    var tmp10_bass = coerceAtMost_0(shaped.t7_1 * (1.0 + 0.15 * popLift), 1.0);
    tmp_21 = shaped.j9(tmp10_bass, tmp9_kick);
  } else {
    tmp_21 = shaped;
  }
  var shapedPop = tmp_21;
  var tmp_22;
  if (buildRise > 0.0) {
    var tmp0_2 = shapedPop.u7_1;
    // Inline function 'kotlin.math.max' call
    var b_2 = rawTarget.e8_1 * 0.45 * buildRise;
    var tmp$ret$18 = Math.max(tmp0_2, b_2);
    tmp_22 = shapedPop.j9(VOID, tmp$ret$18);
  } else {
    tmp_22 = shapedPop;
  }
  var untuned = tmp_22;
  var tmp11_safe_receiver = look.yj_1;
  var tmp_23;
  if (tmp11_safe_receiver == null) {
    tmp_23 = null;
  } else {
    // Inline function 'kotlin.let' call
    tmp_23 = untuned.j9(VOID, coerceIn(tmp11_safe_receiver, 0.0, 1.0));
  }
  var tmp12_elvis_lhs = tmp_23;
  var target = tmp12_elvis_lhs == null ? untuned : tmp12_elvis_lhs;
  var liveSpectrum = playing && fresh;
  var inductionVariable = 0;
  if (inductionVariable < 48)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var goal = liveSpectrum ? target.z7_1.m(i) : 0.0;
      var current = this.gl_1[i];
      var tau = goal > current ? 0.022 : 0.13;
      var tmp_24 = goal - current;
      // Inline function 'kotlin.math.exp' call
      var x_8 = -dt / tau;
      var value = current + tmp_24 * (1.0 - Math.exp(x_8));
      if (value < 1.0E-4)
        value = 0.0;
      this.gl_1[i] = value;
    }
     while (inductionVariable < 48);
  this.fl_1 = new HardstyleFrame(tick$blend(mix, this.fl_1.t7_1, target.t7_1), clockOn ? target.u7_1 : tick$blend(mix, this.fl_1.u7_1, target.u7_1), tick$blend(mix, this.fl_1.v7_1, target.v7_1), tick$blend(mix, this.fl_1.w7_1, target.w7_1), clockOn ? target.x7_1 : tick$blend(mix, this.fl_1.x7_1, target.x7_1), tick$blend(mix, this.fl_1.y7_1, target.y7_1), toList(this.gl_1), tick$blend(mix, this.fl_1.a8_1, playing && fresh ? target.a8_1 : 0.0), tick$blend(mix, this.fl_1.b8_1, target.b8_1), tick$blend(mix, this.fl_1.c8_1, target.c8_1), target.d8_1, target.e8_1, target.f8_1, target.g8_1, target.h8_1, tick$blend(mix, this.fl_1.i8_1, target.i8_1), target.j8_1, target.k8_1, target.l8_1, target.m8_1, target.n8_1, VOID, VOID, VOID, VOID, VOID, VOID, tick$blend(mix, this.fl_1.u8_1, target.u8_1), target.v8_1);
  var f = this.fl_1;
  var ramp = loudRamp(volume);
  var punch = this.dropOn ? this.shakeAmount * f.u7_1 * volumeGain(volume) * f.b8_1 * (5.0 + loudness(volume) * 2.0) * (1.0 + ramp * 0.8) : 0.0;
  var tremble = this.dropOn ? screechShake * f.i8_1 * 3.5 * volumeGain(volume) * f.u7_1 : 0.0;
  if (f.u7_1 < 0.3)
    this.nl_1 = 1.0;
  if (f.u7_1 > 0.55 && this.nl_1 === 1.0) {
    this.nl_1 = 0.0;
    this.hl_1 = this.cl_1.e6() * 2 * 3.141592653589793;
  }
  var push = punch + tremble;
  var big = push > 0.2;
  var tmp_25 = this;
  var tmp_26;
  if (big) {
    // Inline function 'kotlin.math.cos' call
    var x_9 = this.hl_1;
    tmp_26 = Math.cos(x_9) * push;
  } else {
    tmp_26 = 0.0;
  }
  tmp_25.shakeX = tmp_26;
  var tmp_27 = this;
  var tmp_28;
  if (big) {
    // Inline function 'kotlin.math.sin' call
    var x_10 = this.hl_1;
    tmp_28 = Math.sin(x_10) * push;
  } else {
    tmp_28 = 0.0;
  }
  tmp_27.shakeY = tmp_28;
  this.shakeRotation = big ? f.b8_1 * f.u7_1 * 0.4 * (this.hl_1 > 3.141592653589793 ? -1.0 : 1.0) : 0.0;
  var split = f.b8_1 * f.u7_1 * this.shakeAmount;
  this.aberration = effectsOn && split > 0.25 ? coerceAtMost_0((split - 0.25) / 0.75, 1.0) * 5.0 : 0.0;
  this.bounceY = -look.fk_1 * 10.0 * strengthMul;
  this.warmth = look.gk_1;
  var lowBands = 0.0;
  var inductionVariable_0 = 0;
  if (inductionVariable_0 < 24)
    do {
      var i_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      lowBands = lowBands + this.gl_1[i_0];
    }
     while (inductionVariable_0 < 24);
  lowBands = lowBands / 24;
  var tmp_29 = 1.2 * lowBands;
  // Inline function 'kotlin.math.pow' call
  var this_0 = lowBands;
  var tmp$ret$24 = Math.pow(this_0, 1.2);
  // Inline function 'kotlin.math.pow' call
  var this_1 = coerceIn(5.0 * (tmp_29 - tmp$ret$24), 0.0, 1.0);
  var knee = Math.pow(this_1, 0.8);
  var tmp_30 = this;
  var tmp_31 = this.breath;
  var tmp_32 = knee - this.breath;
  // Inline function 'kotlin.math.exp' call
  var x_11 = -dt / (knee > this.breath ? 0.08 : 0.35);
  tmp_30.breath = tmp_31 + tmp_32 * (1.0 - Math.exp(x_11));
  var tmp_33;
  if (sw > 0.5) {
    var tmp_34;
    switch (this.xk_1.xb_1.y_1) {
      case 0:
      case 2:
      case 6:
      case 7:
        tmp_34 = -0.6;
        break;
      case 1:
      case 5:
        tmp_34 = 0.0;
        break;
      case 3:
        tmp_34 = 0.35;
        break;
      case 4:
        tmp_34 = 1.0;
        break;
      default:
        noWhenBranchMatchedException();
        break;
    }
    tmp_33 = tmp_34;
  } else {
    tmp_33 = coerceIn(-0.4 + this.fl_1.w7_1 * 1.2, -0.6, 0.8);
  }
  var gradeTarget = tmp_33;
  var tmp_35 = this;
  var tmp_36 = this.grade;
  var tmp_37 = (playing ? gradeTarget : 0.0) - this.grade;
  // Inline function 'kotlin.math.exp' call
  var x_12 = -dt / 1.5;
  tmp_35.grade = tmp_36 + tmp_37 * (1.0 - Math.exp(x_12));
  var tmp_38 = 0.3 + 0.7 * this.phaseLevel;
  var tmp0_3 = f.u7_1;
  var tmp2 = f.t7_1 * 0.55;
  // Inline function 'kotlin.comparisons.maxOf' call
  var c = f.a8_1 * 0.2;
  var tmp_39 = Math.max(tmp0_3, tmp2, c) + f.b8_1 * f.u7_1 * 0.4;
  var tmp14_elvis_lhs = maxOrNull(this.gl_1);
  var hitGoal = coerceAtMost_0(tmp_38 * (tmp_39 + (tmp14_elvis_lhs == null ? 0.0 : tmp14_elvis_lhs) * 0.25 * volumeGain(volume)), 1.6);
  var tmp_40 = this;
  // Inline function 'kotlin.let' call
  var it_1 = tick$eased(dt, this.partyHit, hitGoal, 0.07, 0.3);
  tmp_40.partyHit = it_1 < 0.001 ? 0.0 : it_1;
  var heavyRaw = f.b8_1 * f.u7_1 * (0.6 + 0.4 * loudness(volume));
  var showOn = structureWeight(v);
  this.subGlow = tick$eased(dt, this.subGlow, 0.12 * f.g8_1 * f.t7_1 * showOn, 0.07, 0.3);
  this.yl_1 = tick$eased(dt, this.yl_1, coerceIn(f.e8_1, 0.0, 1.0) * showOn, 0.04, 0.25);
  var tmp_41 = this;
  // Inline function 'kotlin.let' call
  var it_2 = 0.3 * this.yl_1;
  tmp_41.edgeGlow = it_2 < 0.004 ? 0.0 : it_2;
  this.screechTint = coerceAtMost_0(f.i8_1 * 0.7 * showOn, 0.7);
  var tmp0_4 = f.u7_1 * f.b8_1;
  // Inline function 'kotlin.math.max' call
  var b_3 = f.f8_1 * hardWeight(v);
  var strobeSource = Math.max(tmp0_4, b_3);
  var strobeFrom = 0.85 - 0.15 * hardWeight(v);
  var strobeRaw = this.strobeAmount * strobeSource * coerceIn((volume - strobeFrom) / 0.15, 0.0, 1.0);
  if (strobeRaw > 0.3 && compare(subtract(now, this.vl_1), new Long(400, 0)) >= 0 && this.bl_1.y8(now)) {
    this.vl_1 = now;
    this.xl_1 = this.xl_1 + 1 | 0;
  }
  this.strobe = compare(subtract(now, this.vl_1), new Long(120, 0)) < 0 ? strobeRaw : 0.0;
  this.strobeColor = this.xl_1;
  if (heavyRaw > 0.3 && compare(subtract(now, this.wl_1), new Long(400, 0)) >= 0 && compare(subtract(now, this.vl_1), new Long(120, 0)) >= 0 && this.bl_1.y8(now))
    this.wl_1 = now;
  this.heavyFlash = heavyRaw > 0.02 && compare(subtract(now, this.wl_1), new Long(120, 0)) < 0 ? heavyRaw : 0.0;
  this.ml_1 = easeCoverKick(this.ml_1, f.u7_1, dtS);
  this.coverScale = coverPulseScale(this.breath, this.ml_1, f.b8_1, volume, this.phaseLevel);
  this.il_1.lj(dtS, playing, this.jl_1, this.vk_1.lg(this.jl_1), this.kl_1, this.ll_1, this.coverScale, this.phaseLevel, this.spike, volume, f.b8_1, f.u7_1, clockKick);
};
//region block: post-declaration
protoOf(InternalHashMap).s2 = containsAllEntries;
defineProp(protoOf(WebPartyEngine), 'hop', protoOf(WebPartyEngine).zl);
defineProp(protoOf(WebPartyEngine), 'particleBase', protoOf(WebPartyEngine).nn);
defineProp(protoOf(WebPartyEngine), 'particleMax', protoOf(WebPartyEngine).on);
defineProp(protoOf(WebPartyEngine), 'rippleGapMs', protoOf(WebPartyEngine).pn);
defineProp(protoOf(WebPartyEngine), 'backlightHitTravel', protoOf(WebPartyEngine).rn);
defineProp(protoOf(WebPartyEngine), 'backlightCycleS', protoOf(WebPartyEngine).sn);
defineProp(protoOf(WebPartyEngine), 'haloWidth', protoOf(WebPartyEngine).tn);
defineProp(protoOf(WebPartyEngine), 'haloHeight', protoOf(WebPartyEngine).un);
defineProp(protoOf(WebPartyEngine), 'haloRest', protoOf(WebPartyEngine).vn);
defineProp(protoOf(WebPartyEngine), 'haloGain', protoOf(WebPartyEngine).wn);
defineProp(protoOf(WebPartyEngine), 'haloSwell', protoOf(WebPartyEngine).xn);
defineProp(protoOf(WebPartyEngine), 'haloOffset', protoOf(WebPartyEngine).yn);
defineProp(protoOf(WebPartyEngine), 'haloRoundS', protoOf(WebPartyEngine).zn);
defineProp(protoOf(WebPartyEngine), 'dustDriftS', protoOf(WebPartyEngine).ao);
defineProp(protoOf(WebPartyEngine), 'dustReach', protoOf(WebPartyEngine).bo);
defineProp(protoOf(WebPartyEngine), 'dustSmallDp', protoOf(WebPartyEngine).co);
defineProp(protoOf(WebPartyEngine), 'dustBigDp', protoOf(WebPartyEngine).do);
defineProp(protoOf(WebPartyEngine), 'dustBigEvery', protoOf(WebPartyEngine).eo);
defineProp(protoOf(WebPartyEngine), 'dustWhiteEvery', protoOf(WebPartyEngine).fo);
defineProp(protoOf(WebPartyEngine), 'dustBigAlpha', protoOf(WebPartyEngine).go);
defineProp(protoOf(WebPartyEngine), 'dustRest', protoOf(WebPartyEngine).ho);
defineProp(protoOf(WebPartyEngine), 'dustCalmShare', protoOf(WebPartyEngine).io);
defineProp(protoOf(WebPartyEngine), 'dustAttackS', protoOf(WebPartyEngine).jo);
defineProp(protoOf(WebPartyEngine), 'dustReleaseS', protoOf(WebPartyEngine).ko);
defineProp(protoOf(WebPartyEngine), 'dustSway', protoOf(WebPartyEngine).lo);
defineProp(protoOf(WebPartyEngine), 'waveLifeMs', protoOf(WebPartyEngine).mo);
defineProp(protoOf(WebPartyEngine), 'waveReach', protoOf(WebPartyEngine).no);
defineProp(protoOf(WebPartyEngine), 'waveWidthFrom', protoOf(WebPartyEngine).oo);
defineProp(protoOf(WebPartyEngine), 'waveWidthTo', protoOf(WebPartyEngine).po);
defineProp(protoOf(WebPartyEngine), 'waveAlpha', protoOf(WebPartyEngine).qo);
defineProp(protoOf(WebPartyEngine), 'haloSquash', protoOf(WebPartyEngine).ro);
defineProp(protoOf(WebPartyEngine), 'haloGainCalm', protoOf(WebPartyEngine).so);
defineProp(protoOf(WebPartyEngine), 'videoLightDim', protoOf(WebPartyEngine).to);
defineProp(protoOf(WebPartyEngine), 'dustPaceEaseS', protoOf(WebPartyEngine).uo);
defineProp(protoOf(WebPartyEngine), 'dustStart', protoOf(WebPartyEngine).vo);
defineProp(protoOf(WebPartyEngine), 'dustPathCurve', protoOf(WebPartyEngine).wo);
defineProp(protoOf(WebPartyEngine), 'dustFadeIn', protoOf(WebPartyEngine).xo);
defineProp(protoOf(WebPartyEngine), 'dustFadeOutCurve', protoOf(WebPartyEngine).yo);
defineProp(protoOf(WebPartyEngine), 'dustShimmer', protoOf(WebPartyEngine).zo);
defineProp(protoOf(WebPartyEngine), 'dustWhiteMix', protoOf(WebPartyEngine).ap);
defineProp(protoOf(WebPartyEngine), 'dustTintMix', protoOf(WebPartyEngine).bp);
defineProp(protoOf(WebPartyEngine), 'dustTwinkleShare', protoOf(WebPartyEngine).cp);
defineProp(protoOf(WebPartyEngine), 'dustTwinkleMin', protoOf(WebPartyEngine).dp);
defineProp(protoOf(WebPartyEngine), 'dustTwinkleDecayS', protoOf(WebPartyEngine).ep);
defineProp(protoOf(WebPartyEngine), 'dustBandGain', protoOf(WebPartyEngine).fp);
defineProp(protoOf(WebPartyEngine), 'dustTwinkleGain', protoOf(WebPartyEngine).gp);
defineProp(protoOf(WebPartyEngine), 'waveCount', protoOf(WebPartyEngine).hp);
defineProp(protoOf(WebPartyEngine), 'waveBassFrom', protoOf(WebPartyEngine).ip);
defineProp(protoOf(WebPartyEngine), 'waveGritFrom', protoOf(WebPartyEngine).jp);
defineProp(protoOf(WebPartyEngine), 'waveRearmBass', protoOf(WebPartyEngine).kp);
defineProp(protoOf(WebPartyEngine), 'waveStart', protoOf(WebPartyEngine).lp);
defineProp(protoOf(WebPartyEngine), 'waveSlowdown', protoOf(WebPartyEngine).mp);
defineProp(protoOf(WebPartyEngine), 'waveFadeIn', protoOf(WebPartyEngine).np);
defineProp(protoOf(WebPartyEngine), 'waveFadeOutCurve', protoOf(WebPartyEngine).op);
defineProp(protoOf(WebPartyEngine), 'waveStrokes', protoOf(WebPartyEngine).pp);
defineProp(protoOf(WebPartyEngine), 'waveWhiteMix', protoOf(WebPartyEngine).qp);
defineProp(protoOf(WebPartyEngine), 'edgeGlowBlurDp', protoOf(WebPartyEngine).rp);
defineProp(protoOf(WebPartyEngine), 'edgeGlowSpreadDp', protoOf(WebPartyEngine).sp);
defineProp(protoOf(WebPartyEngine), 'edgeGlowAlpha', protoOf(WebPartyEngine).tp);
defineProp(protoOf(WebPartyEngine), 'auraColorRounds', protoOf(WebPartyEngine).up);
defineProp(protoOf(WebPartyEngine), 'coreReachDp', protoOf(WebPartyEngine).vp);
defineProp(protoOf(WebPartyEngine), 'coreColor', protoOf(WebPartyEngine).wp);
defineProp(protoOf(WebPartyEngine), 'coreRest', protoOf(WebPartyEngine).xp);
defineProp(protoOf(WebPartyEngine), 'coreGain', protoOf(WebPartyEngine).yp);
defineProp(protoOf(WebPartyEngine), 'coreStrokes', protoOf(WebPartyEngine).zp);
defineProp(protoOf(WebPartyEngine), 'coreDensity', protoOf(WebPartyEngine).aq);
defineProp(protoOf(WebPartyEngine), 'bloomBlurDp', protoOf(WebPartyEngine).bq);
defineProp(protoOf(WebPartyEngine), 'bloomRoomBlurs', protoOf(WebPartyEngine).cq);
defineProp(protoOf(WebPartyEngine), 'bloomBackColor', protoOf(WebPartyEngine).dq);
defineProp(protoOf(WebPartyEngine), 'bloomBackAlpha', protoOf(WebPartyEngine).eq);
defineProp(protoOf(WebPartyEngine), 'bloomBackOpen', protoOf(WebPartyEngine).fq);
defineProp(protoOf(WebPartyEngine), 'bloomMainColor', protoOf(WebPartyEngine).gq);
defineProp(protoOf(WebPartyEngine), 'bloomMainAlpha', protoOf(WebPartyEngine).hq);
defineProp(protoOf(WebPartyEngine), 'bloomMainOpen', protoOf(WebPartyEngine).iq);
defineProp(protoOf(WebPartyEngine), 'bloomRimAlpha', protoOf(WebPartyEngine).jq);
defineProp(protoOf(WebPartyEngine), 'bloomRimDp', protoOf(WebPartyEngine).kq);
defineProp(protoOf(WebPartyEngine), 'orbExtent', protoOf(WebPartyEngine).lq);
defineProp(protoOf(WebPartyEngine), 'bass', protoOf(WebPartyEngine).nq);
defineProp(protoOf(WebPartyEngine), 'kick', protoOf(WebPartyEngine).oq);
defineProp(protoOf(WebPartyEngine), 'highs', protoOf(WebPartyEngine).pq);
defineProp(protoOf(WebPartyEngine), 'energy', protoOf(WebPartyEngine).qq);
defineProp(protoOf(WebPartyEngine), 'burst', protoOf(WebPartyEngine).rq);
defineProp(protoOf(WebPartyEngine), 'build', protoOf(WebPartyEngine).sq);
defineProp(protoOf(WebPartyEngine), 'highMotion', protoOf(WebPartyEngine).tq);
defineProp(protoOf(WebPartyEngine), 'heavy', protoOf(WebPartyEngine).uq);
defineProp(protoOf(WebPartyEngine), 'grit', protoOf(WebPartyEngine).vq);
defineProp(protoOf(WebPartyEngine), 'snare', protoOf(WebPartyEngine).wq);
defineProp(protoOf(WebPartyEngine), 'crash', protoOf(WebPartyEngine).xq);
defineProp(protoOf(WebPartyEngine), 'sub', protoOf(WebPartyEngine).yq);
defineProp(protoOf(WebPartyEngine), 'screech', protoOf(WebPartyEngine).zq);
defineProp(protoOf(WebPartyEngine), 'vocal', protoOf(WebPartyEngine).ar);
defineProp(protoOf(WebPartyEngine), 'vocalHit', protoOf(WebPartyEngine).br);
defineProp(protoOf(WebPartyEngine), 'bpm', protoOf(WebPartyEngine).cr);
defineProp(protoOf(WebPartyEngine), 'spectrum', protoOf(WebPartyEngine).dr);
defineProp(protoOf(WebPartyEngine), 'orbLayers', protoOf(WebPartyEngine).fr);
defineProp(protoOf(WebPartyEngine), 'orbOpen', protoOf(WebPartyEngine).gr);
defineProp(protoOf(WebPartyEngine), 'orbGlow', protoOf(WebPartyEngine).hr);
defineProp(protoOf(WebPartyEngine), 'orbDrift', protoOf(WebPartyEngine).ir);
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
