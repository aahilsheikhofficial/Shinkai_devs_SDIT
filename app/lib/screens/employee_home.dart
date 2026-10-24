import 'package:flutter/material.dart';
import '../data/mock.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/traffic_map.dart';
import 'role_picker.dart';

class EmployeeHome extends StatefulWidget {
  const EmployeeHome({super.key});
  @override
  State<EmployeeHome> createState() => _EmployeeHomeState();
}

class _EmployeeHomeState extends State<EmployeeHome> {
  int tab = 0;
  bool tracking = true;
  bool avoiding = false;

  @override
  Widget build(BuildContext context) {
    final pages = [_today(context), _alerts(context), _lateLog(context)];
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 16,
        title: const Logo(sub: 'Employee'),
        actions: [
          const WeatherChip(),
          const SizedBox(width: 6),
          const ThemeButton(),
          IconButton(tooltip: 'Log out', onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst), icon: const Icon(Icons.logout_rounded)),
          const SizedBox(width: 6),
        ],
      ),
      body: pages[tab],
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showReportSheet(context),
        backgroundColor: Palette.accent,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_a_photo_rounded),
        label: const Text('Report', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.today_rounded), label: 'Today'),
          NavigationDestination(icon: Badge(label: Text('2'), child: Icon(Icons.notifications_rounded)), label: 'Alerts'),
          NavigationDestination(icon: Icon(Icons.history_rounded), label: 'Late log'),
        ],
      ),
    );
  }

  Widget _today(BuildContext context) {
    final t = Theme.of(context);
    Widget stat(String k, String v, String s) => Expanded(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: t.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(16)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(k, style: TextStyle(fontSize: 11.5, color: t.hintColor, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(v, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
              Text(s, style: TextStyle(fontSize: 11, color: t.hintColor)),
            ]),
          ),
        );
    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
      Text('Good morning, Aahil 👋', style: t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
      Text('Ullal → TechPark, Padil', style: TextStyle(color: t.hintColor)),
      const SizedBox(height: 16),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('Today’s commute', style: t.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              const Spacer(),
              const LevelChip(Level.severe, '+32 min'),
            ]),
            const SizedBox(height: 12),
            Row(children: [stat('ETA', '09:47', 'usually 09:15'), const SizedBox(width: 8), stat('Cause', 'Accident', 'Pumpwell, 92%')]),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Palette.accent.withValues(alpha: .1), borderRadius: BorderRadius.circular(16), border: Border.all(color: Palette.accent.withValues(alpha: .4))),
              child: Row(children: [
                const Icon(Icons.bolt_rounded, color: Palette.accent),
                const SizedBox(width: 8),
                Expanded(child: Text(avoiding ? 'Taking the bypass. You save 14 min.' : 'Faster route: bypass after Thokkotu saves 14 min.', style: const TextStyle(fontSize: 13))),
                FilledButton(onPressed: () => setState(() => avoiding = !avoiding), child: Text(avoiding ? 'Undo' : 'Avoid')),
              ]),
            ),
            const SizedBox(height: 10),
            const RainWarning(),
          ]),
        ),
      ),
      const SizedBox(height: 14),
      Card(
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 260,
          child: TrafficMap(incidents: incidents.take(2).toList(), showRoute: true, showAlt: avoiding, onIncidentTap: (i) => showIncident(context, i)),
        ),
      ),
      const SizedBox(height: 14),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('Commute tracking', style: t.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
              const Spacer(),
              Switch(value: tracking, activeTrackColor: Palette.accent, onChanged: (v) => setState(() => tracking = v)),
            ]),
            Text(tracking ? 'ON · shared with Infinite Tech only during 8:00–9:30 and work travel.' : 'OFF · nothing is shared.', style: TextStyle(fontSize: 13, color: t.hintColor)),
            const SizedBox(height: 10),
            for (final p in ['Work hours 8:00–18:00', 'Starts when you begin the journey', 'Never on personal trips', 'Emergency (SOS)'])
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [const Icon(Icons.verified_user_rounded, size: 16, color: Palette.free), const SizedBox(width: 8), Text(p, style: const TextStyle(fontSize: 13))]),
              ),
          ]),
        ),
      ),
      const SizedBox(height: 14),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Commute time this week', style: t.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            SizedBox(
              height: 120,
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                for (final d in weekCommute)
                  Expanded(
                    child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                      Text('${d.$2}', style: TextStyle(fontSize: 10, color: t.hintColor)),
                      const SizedBox(height: 3),
                      Container(
                        height: d.$2 * 1.4,
                        margin: const EdgeInsets.symmetric(horizontal: 5),
                        decoration: BoxDecoration(color: d.$2 > 40 ? Palette.accent : Palette.accent.withValues(alpha: .35), borderRadius: BorderRadius.circular(8)),
                      ),
                      const SizedBox(height: 4),
                      Text(d.$1, style: TextStyle(fontSize: 10.5, color: t.hintColor)),
                    ]),
                  ),
              ]),
            ),
          ]),
        ),
      ),
    ]);
  }

  Widget _alerts(BuildContext context) => ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
        Text('Alerts on your route', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        const RainWarning(),
        const SizedBox(height: 10),
        for (final i in incidents) ...[IncidentTile(i), const SizedBox(height: 10)],
      ]);

  Widget _lateLog(BuildContext context) {
    final t = Theme.of(context);
    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0xFFA3A3A3), width: 3)),
              child: const Icon(Icons.military_tech_rounded, color: Color(0xFFA3A3A3), size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Silver badge · 640 pts', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                Text('160 pts to Gold. Verified reports earn points; false claims lose them.', style: TextStyle(fontSize: 12.5, color: t.hintColor)),
              ]),
            ),
          ]),
        ),
      ),
      const SizedBox(height: 16),
      Text('Late arrival log', style: t.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
      Text('Your company sees why you were late automatically.', style: TextStyle(color: t.hintColor)),
      const SizedBox(height: 12),
      for (final l in lateLog)
        Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            title: Text('${l.date} · +${l.delay} min', style: const TextStyle(fontWeight: FontWeight.w800)),
            subtitle: Text('${l.reason}\n${l.evidence}'),
            isThreeLine: true,
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(color: (l.excused ? Palette.free : Palette.moderate).withValues(alpha: .15), borderRadius: BorderRadius.circular(999)),
              child: Text(l.excused ? 'Excused' : 'Add note', style: TextStyle(color: l.excused ? Palette.free : Palette.moderate, fontWeight: FontWeight.w700, fontSize: 12)),
            ),
          ),
        ),
    ]);
  }
}
