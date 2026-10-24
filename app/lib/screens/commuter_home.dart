import 'package:flutter/material.dart';
import '../data/mock.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/traffic_map.dart';

class CommuterHome extends StatefulWidget {
  const CommuterHome({super.key});
  @override
  State<CommuterHome> createState() => _CommuterHomeState();
}

class _CommuterHomeState extends State<CommuterHome> {
  bool avoiding = false;
  final search = SearchController();

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      body: Stack(children: [
        Positioned.fill(child: TrafficMap(showRoute: true, showAlt: avoiding, onIncidentTap: (i) => showIncident(context, i))),
        // Top bar: search, weather, theme
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Column(children: [
              Row(children: [
                Expanded(
                  child: SearchAnchor.bar(
                    searchController: search,
                    barHintText: 'Search a place or road',
                    barElevation: const WidgetStatePropertyAll(2),
                    barBackgroundColor: WidgetStatePropertyAll(t.colorScheme.surface),
                    barLeading: const Icon(Icons.search_rounded),
                    suggestionsBuilder: (context, c) {
                      final q = c.text.toLowerCase();
                      return [
                        for (final i in incidents.where((i) => q.isEmpty || i.place.toLowerCase().contains(q) || i.reason.toLowerCase().contains(q)))
                          ListTile(
                            leading: Icon(Icons.place_rounded, color: i.level == Level.closed ? null : i.level.color),
                            title: Text(i.place),
                            subtitle: Text('${i.reason} · +${i.delayMin} min'),
                            onTap: () {
                              c.closeView(i.place);
                              showIncident(context, i);
                            },
                          ),
                      ];
                    },
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert_rounded),
                  style: IconButton.styleFrom(backgroundColor: t.colorScheme.surface),
                  onSelected: (v) {
                    if (v == 'theme') themeMode.value = themeMode.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
                    if (v == 'out') Navigator.of(context).popUntil((r) => r.isFirst);
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'theme', child: Text('Light / dark')),
                    PopupMenuItem(value: 'out', child: Text('Log out')),
                  ],
                ),
              ]),
              const SizedBox(height: 10),
              Align(alignment: Alignment.centerLeft, child: const WeatherChip()),
              const SizedBox(height: 10),
              // Alert on the current route
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      const Icon(Icons.warning_amber_rounded, color: Palette.severe, size: 20),
                      const SizedBox(width: 6),
                      Expanded(child: Text(avoiding ? 'Rerouted around Pumpwell' : 'Accident ahead at Pumpwell', style: const TextStyle(fontWeight: FontWeight.w800))),
                      const LevelChip(Level.severe, '+32 min'),
                    ]),
                    const SizedBox(height: 4),
                    Text(
                      avoiding ? 'New route saves 14 min. Teal dotted line on the map.' : '14 people reported · GPS speed 2 km/h for 30 min · 92% sure',
                      style: TextStyle(fontSize: 12.5, color: t.hintColor),
                    ),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: () => setState(() => avoiding = !avoiding),
                          icon: Icon(avoiding ? Icons.undo_rounded : Icons.alt_route_rounded),
                          label: Text(avoiding ? 'Back to usual route' : 'Avoid (−14 min)'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(onPressed: () => showIncident(context, incidents.first), child: const Text('Why?')),
                    ]),
                  ]),
                ),
              ),
            ]),
          ),
        ),
        // Bottom sheet: nearby incidents
        DraggableScrollableSheet(
          initialChildSize: .2,
          minChildSize: .12,
          maxChildSize: .75,
          builder: (context, scroll) => Container(
            decoration: BoxDecoration(
              color: t.scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: const [BoxShadow(blurRadius: 16, color: Colors.black26)],
            ),
            child: ListView(controller: scroll, padding: const EdgeInsets.fromLTRB(16, 10, 16, 110), children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: t.colorScheme.outlineVariant, borderRadius: BorderRadius.circular(4)))),
              const SizedBox(height: 12),
              Text('Near you', style: t.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              const RainWarning(),
              const SizedBox(height: 10),
              for (final i in incidents) ...[IncidentTile(i), const SizedBox(height: 10)],
            ]),
          ),
        ),
      ]),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(children: [
          Expanded(
            child: FloatingActionButton.extended(
              heroTag: 'report',
              onPressed: () => showReportSheet(context),
              backgroundColor: Palette.accent,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_a_photo_rounded),
              label: const Text('Report', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
          const SizedBox(width: 12),
          FloatingActionButton.extended(
            heroTag: 'sos',
            onPressed: () => _sos(context),
            backgroundColor: Palette.severe,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.sos_rounded),
            label: const Text('SOS', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ]),
      ),
    );
  }

  void _sos(BuildContext context) => showDialog(
        context: context,
        builder: (context) => AlertDialog(
          icon: const Icon(Icons.sos_rounded, color: Palette.severe, size: 40),
          title: const Text('Send SOS?'),
          content: const Text('Your live location goes to emergency contacts and nearby traffic police.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Palette.severe),
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS sent (demo).')));
              },
              child: const Text('Send SOS'),
            ),
          ],
        ),
      );
}
