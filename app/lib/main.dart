import 'package:flutter/material.dart';
import 'data/weather.dart';
import 'screens/role_picker.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  WeatherService.load(); // start fetching weather right away
  runApp(const TrafficSenseApp());
}

class TrafficSenseApp extends StatelessWidget {
  const TrafficSenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: themeMode,
      builder: (context, mode, _) => MaterialApp(
        title: 'TrafficSense',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(Brightness.light),
        darkTheme: buildTheme(Brightness.dark),
        themeMode: mode,
        home: const RolePicker(),
      ),
    );
  }
}
