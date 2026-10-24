import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../theme.dart';

// Dummy data matching the website. Replaced by the FastAPI backend later.

enum Level { free, moderate, heavy, severe, closed }

extension LevelX on Level {
  Color get color => const {
        Level.free: Palette.free,
        Level.moderate: Palette.moderate,
        Level.heavy: Palette.heavy,
        Level.severe: Palette.severe,
        Level.closed: Palette.closed,
      }[this]!;
  String get label => const {
        Level.free: 'Normal',
        Level.moderate: 'Moderate',
        Level.heavy: 'Heavy',
        Level.severe: 'Severe',
        Level.closed: 'Closed',
      }[this]!;
}

const mangaluru = LatLng(12.872, 74.862);

class Incident {
  final String id, reason, place, since;
  final LatLng pos;
  final Level level;
  final int delayMin, confidence, verification, reports;
  const Incident(this.id, this.reason, this.place, this.pos, this.level, this.delayMin, this.confidence, this.verification, this.reports, this.since);
}

const incidents = [
  Incident('INC-2041', 'Accident', 'Pumpwell flyover', LatLng(12.8695, 74.8555), Level.severe, 32, 92, 5, 14, '08:12'),
  Incident('INC-2042', 'Road repair', 'Thokkotu junction', LatLng(12.8185, 74.8590), Level.heavy, 18, 84, 4, 7, '07:40'),
  Incident('INC-2043', 'Flood', 'Ullal Road', LatLng(12.8075, 74.8495), Level.closed, 45, 96, 6, 22, '06:55'),
  Incident('INC-2044', 'Signal failure', 'Nanthoor circle', LatLng(12.8876, 74.8607), Level.heavy, 11, 71, 3, 5, '08:31'),
  Incident('INC-2045', 'Breakdown', 'Kulur bridge', LatLng(12.9246, 74.8297), Level.moderate, 6, 58, 2, 2, '08:44'),
];

const verificationSteps = ['User report', 'GPS location', 'Multiple users', 'GPS speed confirms', 'Photo / video', 'Authority confirmed'];

const home = LatLng(12.8075, 74.8495);
const office = LatLng(12.8790, 74.8960);
const route = [
  LatLng(12.8075, 74.8495), LatLng(12.8185, 74.8590), LatLng(12.8450, 74.8572),
  LatLng(12.8695, 74.8555), LatLng(12.8736, 74.8850), LatLng(12.8790, 74.8960),
];
const altRoute = [LatLng(12.8185, 74.8590), LatLng(12.8350, 74.8750), LatLng(12.8600, 74.8850), LatLng(12.8736, 74.8850)];

/// Rough road network for the offline (no Google) map
const roads = <(List<LatLng>, Level)>[
  ([LatLng(12.99, 74.803), LatLng(12.9246, 74.8297), LatLng(12.905, 74.841), LatLng(12.8876, 74.8607)], Level.moderate),
  ([LatLng(12.8876, 74.8607), LatLng(12.8695, 74.8555)], Level.heavy),
  ([LatLng(12.8695, 74.8555), LatLng(12.8450, 74.8572), LatLng(12.8185, 74.8590)], Level.severe),
  ([LatLng(12.8185, 74.8590), LatLng(12.78, 74.865)], Level.heavy),
  ([LatLng(12.8695, 74.8555), LatLng(12.8736, 74.8850)], Level.heavy),
  ([LatLng(12.8736, 74.8850), LatLng(12.8790, 74.8960), LatLng(12.885, 74.93)], Level.free),
  ([LatLng(12.8701, 74.8430), LatLng(12.8720, 74.8500), LatLng(12.8695, 74.8555)], Level.moderate),
  ([LatLng(12.905, 74.841), LatLng(12.885, 74.840), LatLng(12.8701, 74.8430)], Level.free),
  ([LatLng(12.8185, 74.8590), LatLng(12.8075, 74.8495)], Level.closed),
];

class LateEntry {
  final String date, reason, evidence;
  final int delay;
  final bool excused;
  const LateEntry(this.date, this.delay, this.reason, this.evidence, this.excused);
}

const lateLog = [
  LateEntry('Today', 32, 'Accident at Pumpwell', 'GPS stayed in zone 08:12–08:47', true),
  LateEntry('Wed 21', 22, 'Heavy rain, Thokkotu', '6 nearby reports + weather data', true),
  LateEntry('Mon 12', 9, 'No incident found', 'Route was clear', false),
];

const weekCommute = [('Mon', 34), ('Tue', 31), ('Wed', 52), ('Thu', 38), ('Fri', 29), ('Sat', 27), ('Today', 62)];
