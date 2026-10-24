import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'login.dart';

enum Role { commuter, employee }

extension RoleX on Role {
  String get title => this == Role.commuter ? 'Commuter' : 'Employee';
  String get who => this == Role.commuter ? 'I travel around the city' : 'I commute to work';
  String get art => 'assets/artwork/$name.webp';
  IconData get icon => this == Role.commuter ? Icons.directions_car_rounded : Icons.work_rounded;
  String get blurb => this == Role.commuter
      ? 'See why a road is blocked, get a better route, and report what you see in one tap.'
      : 'Your commute and its delays, shared with your company only during work travel.';
}

/// "Who are you?" — the artwork swaps with the chosen role.
class RolePicker extends StatefulWidget {
  const RolePicker({super.key});
  @override
  State<RolePicker> createState() => _RolePickerState();
}

class _RolePickerState extends State<RolePicker> {
  Role picked = Role.commuter;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 24), children: [
          Row(children: [const Logo(), const Spacer(), const ThemeButton()]),
          const SizedBox(height: 18),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: ClipRRect(
              key: ValueKey(picked),
              borderRadius: BorderRadius.circular(24),
              child: AspectRatio(aspectRatio: 4 / 3, child: Image.asset(picked.art, fit: BoxFit.cover)),
            ),
          ),
          const SizedBox(height: 22),
          Text.rich(
            TextSpan(children: [const TextSpan(text: 'Who are '), TextSpan(text: 'you?', style: TextStyle(color: Palette.accent))]),
            style: t.textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -.5),
          ),
          const SizedBox(height: 6),
          Text('TrafficSense tells you why a road is blocked, not just that it is.', style: TextStyle(color: t.hintColor)),
          const SizedBox(height: 18),
          for (final r in Role.values) ...[
            _RoleCard(role: r, selected: picked == r, onTap: () => setState(() => picked = r)),
            const SizedBox(height: 10),
          ],
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => LoginScreen(role: picked))),
            icon: const Icon(Icons.arrow_forward_rounded),
            label: Text('Continue as ${picked.title}'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
          ),
          const SizedBox(height: 12),
          Center(child: Text('Company and Government dashboards are on the website.', style: TextStyle(fontSize: 12, color: t.hintColor))),
        ]),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final Role role;
  final bool selected;
  final VoidCallback onTap;
  const _RoleCard({required this.role, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: selected ? Palette.accent.withValues(alpha: .1) : t.colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: selected ? Palette.accent : t.colorScheme.outlineVariant, width: selected ? 1.6 : 1),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          splashColor: Palette.accent.withValues(alpha: .15),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(color: selected ? Palette.accent : t.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(13)),
                child: Icon(role.icon, color: selected ? Colors.white : null),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(role.title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  Text(role.who, style: TextStyle(color: t.hintColor, fontSize: 13)),
                ]),
              ),
              if (selected) const Icon(Icons.check_circle_rounded, color: Palette.accent),
            ]),
          ),
        ),
      ),
    );
  }
}

class Logo extends StatelessWidget {
  final String? sub;
  const Logo({super.key, this.sub});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(color: Palette.accent, borderRadius: BorderRadius.circular(11)),
          child: const Icon(Icons.navigation_rounded, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('TrafficSense', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          if (sub != null) Text(sub!, style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
        ]),
      ]);
}
