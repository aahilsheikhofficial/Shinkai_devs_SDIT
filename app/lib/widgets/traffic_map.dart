import 'dart:math' as math;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../data/mock.dart';
import '../data/mock.dart' as mock show incidents;
import '../theme.dart';

const allIncidents = mock.incidents;

/// Google map on Android (key in android/local.properties). On web/Chrome
/// test runs it draws a simple offline map instead, so it never breaks.
class TrafficMap extends StatefulWidget {
  final List<Incident> incidents;
  final bool showRoute, showAlt;
  final void Function(Incident)? onIncidentTap;
  const TrafficMap({super.key, this.incidents = allIncidents, this.showRoute = false, this.showAlt = false, this.onIncidentTap});

  @override
  State<TrafficMap> createState() => _TrafficMapState();
}

class _TrafficMapState extends State<TrafficMap> {
  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    if (kIsWeb) return _OfflineMap(widget: widget, dark: dark);
    return GoogleMap(
      initialCameraPosition: const CameraPosition(target: mangaluru, zoom: 12.2),
      trafficEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      style: dark ? _darkStyle : null,
      markers: {
        for (final i in widget.incidents)
          Marker(
            markerId: MarkerId(i.id),
            position: i.pos,
            icon: BitmapDescriptor.defaultMarkerWithHue(_hue(i.level)),
            infoWindow: InfoWindow(title: i.reason, snippet: '${i.place} · +${i.delayMin} min · ${i.confidence}%'),
            onTap: () => widget.onIncidentTap?.call(i),
          ),
        if (widget.showRoute) ...[
          Marker(markerId: const MarkerId('home'), position: home, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure), infoWindow: const InfoWindow(title: 'Home')),
          Marker(markerId: const MarkerId('office'), position: office, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange), infoWindow: const InfoWindow(title: 'Office')),
        ],
      },
      polylines: {
        if (widget.showRoute) Polyline(polylineId: const PolylineId('route'), points: route, color: Palette.accent, width: 7),
        if (widget.showAlt)
          Polyline(polylineId: const PolylineId('alt'), points: altRoute, color: Palette.teal, width: 6, patterns: [PatternItem.dot, PatternItem.gap(12)]),
      },
    );
  }

  double _hue(Level l) => switch (l) {
        Level.free => BitmapDescriptor.hueGreen,
        Level.moderate => BitmapDescriptor.hueYellow,
        Level.heavy => BitmapDescriptor.hueOrange,
        Level.severe => BitmapDescriptor.hueRed,
        Level.closed => BitmapDescriptor.hueViolet,
      };
}

class _OfflineMap extends StatefulWidget {
  final TrafficMap widget;
  final bool dark;
  const _OfflineMap({required this.widget, required this.dark});
  @override
  State<_OfflineMap> createState() => _OfflineMapState();
}

class _OfflineMapState extends State<_OfflineMap> with SingleTickerProviderStateMixin {
  late final _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();
  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final p = _MapPainter(widget.widget, widget.dark, _pulse);
      return GestureDetector(
        onTapUp: (d) {
          final hit = p.incidentAt(d.localPosition, c.biggest);
          if (hit != null) widget.widget.onIncidentTap?.call(hit);
        },
        child: CustomPaint(size: c.biggest, painter: p),
      );
    });
  }
}

class _MapPainter extends CustomPainter {
  final TrafficMap w;
  final bool dark;
  final Animation<double> pulse;
  _MapPainter(this.w, this.dark, this.pulse) : super(repaint: pulse);

  static const _minLat = 12.79, _maxLat = 12.995, _minLng = 74.80, _maxLng = 74.935;

  Offset _pt(LatLng l, Size s) {
    // keep aspect ratio, centre the box
    final latSpan = _maxLat - _minLat, lngSpan = (_maxLng - _minLng) * math.cos(12.9 * math.pi / 180);
    final scale = math.min(s.width / lngSpan, s.height / latSpan) * 1.25;
    final x = (l.longitude - _minLng) * math.cos(12.9 * math.pi / 180) * scale;
    final y = (_maxLat - l.latitude) * scale;
    return Offset(x - (lngSpan * scale - s.width) / 2, y - (latSpan * scale - s.height) / 2);
  }

  Incident? incidentAt(Offset pos, Size s) {
    for (final i in w.incidents) {
      if ((_pt(i.pos, s) - pos).distance < 22) return i;
    }
    return null;
  }

  @override
  void paint(Canvas canvas, Size s) {
    canvas.drawRect(Offset.zero & s, Paint()..color = dark ? const Color(0xFF262626) : const Color(0xFFEFE9DF));
    // Arabian Sea on the west
    final sea = Path()..moveTo(0, 0);
    for (final l in const [LatLng(13.0, 74.79), LatLng(12.95, 74.80), LatLng(12.90, 74.815), LatLng(12.85, 74.825), LatLng(12.80, 74.84), LatLng(12.78, 74.845)]) {
      final o = _pt(l, s);
      sea.lineTo(o.dx, o.dy);
    }
    sea
      ..lineTo(0, s.height)
      ..close();
    canvas.drawPath(sea, Paint()..color = dark ? const Color(0xFF1A1F24) : const Color(0xFFCFE3EF));

    void line(List<LatLng> pts, Color c, double width, {bool dashed = false}) {
      final path = Path();
      for (var i = 0; i < pts.length; i++) {
        final o = _pt(pts[i], s);
        i == 0 ? path.moveTo(o.dx, o.dy) : path.lineTo(o.dx, o.dy);
      }
      final paint = Paint()
        ..color = c
        ..strokeWidth = width
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      if (!dashed) return canvas.drawPath(path, paint);
      for (final m in path.computeMetrics()) {
        for (double d = 0; d < m.length; d += 12) {
          canvas.drawPath(m.extractPath(d, d + 4), paint);
        }
      }
    }

    final casing = dark ? const Color(0xFF3A3A3A) : Colors.white;
    for (final r in roads) {
      line(r.$1, casing, 11);
    }
    for (final r in roads) {
      line(r.$1, r.$2 == Level.closed ? (dark ? Colors.white70 : Palette.closed) : r.$2.color, 4.5, dashed: r.$2 == Level.closed);
    }
    if (w.showAlt) line(altRoute, Palette.teal, 5, dashed: true);
    if (w.showRoute) {
      line(route, Palette.accent.withValues(alpha: .3), 14);
      line(route, Palette.accent, 5.5);
      canvas.drawCircle(_pt(home, s), 7, Paint()..color = Colors.white);
      canvas.drawCircle(_pt(home, s), 7, Paint()..color = Palette.accent..style = PaintingStyle.stroke..strokeWidth = 3.5);
      canvas.drawCircle(_pt(office, s), 9, Paint()..color = Palette.accent);
      canvas.drawCircle(_pt(office, s), 9, Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 2.5);
    }
    for (final i in w.incidents) {
      final o = _pt(i.pos, s);
      final c = i.level == Level.closed ? (dark ? Colors.white : Palette.closed) : i.level.color;
      canvas.drawCircle(o, 8 + 18 * pulse.value, Paint()..color = c.withValues(alpha: .45 * (1 - pulse.value)));
      canvas.drawCircle(o, 9, Paint()..color = c);
      canvas.drawCircle(o, 9, Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 2.5);
    }
  }

  @override
  bool shouldRepaint(covariant _MapPainter old) => old.dark != dark || old.w != w;
}

const _darkStyle = '''[
{"elementType":"geometry","stylers":[{"color":"#242424"}]},
{"elementType":"labels.text.fill","stylers":[{"color":"#8a8580"}]},
{"elementType":"labels.text.stroke","stylers":[{"color":"#1a1a1a"}]},
{"featureType":"road","elementType":"geometry","stylers":[{"color":"#3a3a3a"}]},
{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#4a4a4a"}]},
{"featureType":"poi","stylers":[{"visibility":"off"}]},
{"featureType":"transit","stylers":[{"visibility":"off"}]},
{"featureType":"water","elementType":"geometry","stylers":[{"color":"#1a1f24"}]}
]''';
