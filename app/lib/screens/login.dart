import 'package:flutter/material.dart';
import 'commuter_home.dart';
import 'employee_home.dart';
import 'role_picker.dart';

/// Sign in — shows only the chosen role's artwork. Any details work in demo mode.
class LoginScreen extends StatelessWidget {
  final Role role;
  const LoginScreen({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(fit: StackFit.expand, children: [
              Image.asset(role.art, fit: BoxFit.cover),
              const DecoratedBox(
                decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black54])),
              ),
              Positioned(
                left: 20, right: 20, bottom: 18,
                child: Text(role.blurb, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
              ),
            ]),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          sliver: SliverList.list(children: [
            Logo(sub: '${role.title} sign in'),
            const SizedBox(height: 24),
            TextFormField(
              initialValue: role == Role.employee ? 'aahil@infinitetech.in' : '+91 98450 12345',
              decoration: InputDecoration(prefixIcon: const Icon(Icons.person_rounded), labelText: role == Role.employee ? 'Work email' : 'Phone or email'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              initialValue: 'demo1234',
              obscureText: true,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.lock_rounded), labelText: 'Password'),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () => Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => role == Role.employee ? const EmployeeHome() : const CommuterHome()),
                (r) => r.isFirst,
              ),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              child: const Text('Sign in'),
            ),
            const SizedBox(height: 12),
            Center(child: Text('Demo mode: any details work.', style: TextStyle(fontSize: 12, color: t.hintColor))),
          ]),
        ),
      ]),
    );
  }
}
