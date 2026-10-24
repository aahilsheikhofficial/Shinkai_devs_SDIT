import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../data/mock.dart';
import '../data/weather.dart';
import '../theme.dart';

IconData weatherIcon(int code) => code == 0
    ? Icons.wb_sunny_rounded
    : code >= 95
        ? Icons.thunderstorm_rounded
        : code >= 51
            ? Icons.water_drop_rounded
            : Icons.cloud_rounded;

/// Live weather pill (Open-Meteo)
class WeatherChip extends StatelessWidget {
  const WeatherChip({super.key});
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Weather>(
      future: WeatherService.load(),
      initialData: WeatherService.current,
      builder: (context, snap) {
        final w = snap.data!;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(weatherIcon(w.code), size: 16, color: w.code >= 51 ? Palette.teal : Palette.moderate),
            const SizedBox(width: 6),
            Text('${w.tempC}° ${w.label}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          ]),
        );
      },
    );
  }
}

class RainWarning extends StatelessWidget {
  const RainWarning({super.key});
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Weather>(
      future: WeatherService.load(),
      initialData: WeatherService.current,
      builder: (context, snap) {
        final w = snap.data!;
        if (!w.rainSoon) return const SizedBox.shrink();
        final c = w.heavySoon ? Palette.severe : Palette.teal;
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: c.withValues(alpha: .1), borderRadius: BorderRadius.circular(16), border: Border.all(color: c.withValues(alpha: .4))),
          child: Row(children: [
            Icon(Icons.umbrella_rounded, color: c),
            const SizedBox(width: 10),
            Expanded(
              child: Text('${w.heavySoon ? 'Heavy rain' : 'Rain'} expected: ${w.rainNext3h} mm in the next 3 h (${w.chanceNext3h}%). Leave 10–15 min early.',
                  style: const TextStyle(fontSize: 13)),
            ),
          ]),
        );
      },
    );
  }
}

class LevelChip extends StatelessWidget {
  final Level level;
  final String text;
  const LevelChip(this.level, this.text, {super.key});
  @override
  Widget build(BuildContext context) {
    final c = level == Level.closed ? Theme.of(context).colorScheme.onSurface : level.color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(color: c.withValues(alpha: .14), borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: TextStyle(color: c, fontSize: 11.5, fontWeight: FontWeight.w700)),
    );
  }
}

class VerifyDots extends StatelessWidget {
  final int level;
  const VerifyDots(this.level, {super.key});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 0; i < 6; i++)
          Container(
            width: 6, height: 6, margin: const EdgeInsets.only(right: 3),
            decoration: BoxDecoration(shape: BoxShape.circle, color: i < level ? Palette.accent : Theme.of(context).colorScheme.outlineVariant),
          ),
        const SizedBox(width: 3),
        Text('L$level', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Theme.of(context).hintColor)),
      ]);
}

class ConfidenceBar extends StatelessWidget {
  final int value;
  const ConfidenceBar(this.value, {super.key});
  @override
  Widget build(BuildContext context) {
    final c = value >= 85 ? Palette.free : value >= 65 ? Palette.moderate : Palette.severe;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      SizedBox(
        width: 54,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(9),
          child: LinearProgressIndicator(value: value / 100, minHeight: 6, color: c, backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest),
        ),
      ),
      const SizedBox(width: 6),
      Text('$value%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
    ]);
  }
}

class IncidentTile extends StatelessWidget {
  final Incident i;
  final VoidCallback? onTap;
  const IncidentTile(this.i, {super.key, this.onTap});
  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap ?? () => showIncident(context, i),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.warning_amber_rounded, size: 18, color: Palette.accent),
              const SizedBox(width: 6),
              Expanded(child: Text(i.reason, style: const TextStyle(fontWeight: FontWeight.w800))),
              LevelChip(i.level, i.level == Level.closed ? 'Closed' : '+${i.delayMin} min'),
            ]),
            const SizedBox(height: 4),
            Text('${i.place} · since ${i.since} · ${i.reports} reports', style: TextStyle(fontSize: 12, color: Theme.of(context).hintColor)),
            const SizedBox(height: 8),
            Row(children: [VerifyDots(i.verification), const Spacer(), ConfidenceBar(i.confidence)]),
          ]),
        ),
      ),
    );
  }
}

void showIncident(BuildContext context, Incident i, {VoidCallback? onAvoid}) {
  showModalBottomSheet(
    context: context,
    showDragHandle: true,
    builder: (context) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text('${i.reason} · ${i.place}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
          LevelChip(i.level, i.level.label),
        ]),
        const SizedBox(height: 6),
        Text('+${i.delayMin} min · ${i.reports} people reported · since ${i.since}', style: TextStyle(color: Theme.of(context).hintColor)),
        const SizedBox(height: 16),
        const Text('Verification', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Wrap(spacing: 6, runSpacing: 6, children: [
          for (var n = 0; n < verificationSteps.length; n++)
            Chip(
              label: Text('${n + 1}. ${verificationSteps[n]}', style: TextStyle(fontSize: 12, color: n < i.verification ? Colors.white : null)),
              backgroundColor: n < i.verification ? Palette.accent : null,
              side: BorderSide.none,
              visualDensity: VisualDensity.compact,
            ),
        ]),
        const SizedBox(height: 12),
        Row(children: [const Text('Confidence  '), ConfidenceBar(i.confidence)]),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(child: OutlinedButton.icon(onPressed: () {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Thanks, confirmed. ${i.place} now has ${i.reports + 1} reports.')));
          }, icon: const Icon(Icons.check_rounded), label: const Text('I see it too'))),
          const SizedBox(width: 10),
          Expanded(child: FilledButton.icon(onPressed: () {
            Navigator.pop(context);
            onAvoid?.call();
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rerouted. Teal dotted line shows the new route.')));
          }, icon: const Icon(Icons.alt_route_rounded), label: const Text('Avoid'))),
        ]),
      ]),
    ),
  );
}

class ThemeButton extends StatelessWidget {
  const ThemeButton({super.key});
  @override
  Widget build(BuildContext context) => IconButton.outlined(
        tooltip: 'Light / dark',
        onPressed: () => themeMode.value = themeMode.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark,
        icon: Icon(Theme.of(context).brightness == Brightness.dark ? Icons.light_mode_rounded : Icons.dark_mode_rounded),
      );
}

/// Camera or gallery, photo or video
Future<XFile?> pickPhoto(BuildContext context) async {
  final choice = await showModalBottomSheet<int>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ListTile(leading: const Icon(Icons.photo_camera_rounded), title: const Text('Take photo'), onTap: () => Navigator.pop(context, 0)),
        ListTile(leading: const Icon(Icons.videocam_rounded), title: const Text('Record video'), onTap: () => Navigator.pop(context, 1)),
        ListTile(leading: const Icon(Icons.photo_library_rounded), title: const Text('Choose from gallery'), onTap: () => Navigator.pop(context, 2)),
      ]),
    ),
  );
  if (choice == null) return null;
  final p = ImagePicker();
  try {
    return switch (choice) {
      0 => await p.pickImage(source: ImageSource.camera, imageQuality: 70),
      1 => await p.pickVideo(source: ImageSource.camera, maxDuration: const Duration(seconds: 30)),
      _ => await p.pickMedia(imageQuality: 70),
    };
  } catch (_) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Camera not available on this device.')));
    return null;
  }
}

/// One-tap incident report sheet (GPS + time attached automatically)
void showReportSheet(BuildContext context) {
  const kinds = [
    ('Accident', Icons.car_crash_rounded), ('Road repair', Icons.construction_rounded),
    ('Flood / rain', Icons.flood_rounded), ('Signal down', Icons.traffic_rounded),
    ('Festival / event', Icons.celebration_rounded), ('VIP movement', Icons.local_police_rounded),
  ];
  String? picked;
  XFile? photo;
  showModalBottomSheet(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => StatefulBuilder(
      builder: (context, set) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('What do you see?', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Your GPS location and time are attached automatically.', style: TextStyle(fontSize: 13, color: Theme.of(context).hintColor)),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2, shrinkWrap: true, childAspectRatio: 3.2, mainAxisSpacing: 8, crossAxisSpacing: 8,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (final k in kinds)
                OutlinedButton.icon(
                  style: picked == k.$1 ? OutlinedButton.styleFrom(backgroundColor: Palette.accent.withValues(alpha: .12), side: const BorderSide(color: Palette.accent)) : null,
                  onPressed: () => set(() => picked = k.$1),
                  icon: Icon(k.$2, color: Palette.accent, size: 18),
                  label: Text(k.$1, overflow: TextOverflow.ellipsis),
                ),
            ],
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () async {
              final f = await pickPhoto(context);
              if (f != null) set(() => photo = f);
            },
            icon: Icon(photo == null ? Icons.photo_camera_rounded : Icons.check_circle_rounded),
            label: Text(photo == null ? 'Add photo / video' : 'Attached: ${photo!.name}', overflow: TextOverflow.ellipsis),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
          const SizedBox(height: 10),
          FilledButton(
            onPressed: picked == null
                ? null
                : () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$picked reported${photo != null ? ' with photo' : ''}. Nearby users will confirm it.')));
                  },
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
            child: const Text('Send report'),
          ),
        ]),
      ),
    ),
  );
}
