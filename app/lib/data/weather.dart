import 'dart:convert';
import 'package:http/http.dart' as http;
import 'mock.dart';

/// Live weather from Open-Meteo (free, no key). Cached 30 min; sample data offline.
class DayForecast {
  final String day;
  final double rainMm;
  final int chance, code;
  const DayForecast(this.day, this.rainMm, this.chance, this.code);
  String get risk => rainMm >= 20 || (rainMm >= 10 && chance >= 70) ? 'High' : rainMm >= 5 || chance >= 50 ? 'Medium' : 'Low';
}

class Weather {
  final bool live;
  final int tempC, code, chanceNext3h;
  final double rainNext3h;
  final List<DayForecast> days;
  const Weather({required this.live, required this.tempC, required this.code, required this.rainNext3h, required this.chanceNext3h, required this.days});

  String get label {
    if (code == 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 82) return 'Showers';
    if (code >= 95) return 'Storm';
    return 'Cloudy';
  }

  bool get rainSoon => rainNext3h >= 2 || chanceNext3h >= 60;
  bool get heavySoon => rainNext3h >= 7;
}

const _sample = Weather(live: false, tempC: 27, code: 63, rainNext3h: 9, chanceNext3h: 80, days: [
  DayForecast('Today', 6, 55, 61), DayForecast('Sat', 14, 70, 63), DayForecast('Sun', 32, 90, 65),
  DayForecast('Mon', 28, 85, 82), DayForecast('Tue', 8, 50, 61),
]);

class WeatherService {
  static Weather? _cache;
  static DateTime? _at;
  static Future<Weather>? _inflight;

  static Weather get current => _cache ?? _sample;

  static Future<Weather> load() {
    if (_cache != null && DateTime.now().difference(_at!) < const Duration(minutes: 30)) return Future.value(_cache);
    return _inflight ??= _fetch().whenComplete(() => _inflight = null);
  }

  static Future<Weather> _fetch() async {
    final uri = Uri.parse('https://api.open-meteo.com/v1/forecast?latitude=${mangaluru.latitude}&longitude=${mangaluru.longitude}'
        '&current=temperature_2m,weather_code&hourly=precipitation,precipitation_probability'
        '&daily=precipitation_sum,precipitation_probability_max,weather_code&timezone=Asia%2FKolkata&forecast_days=5');
    try {
      final res = await http.get(uri).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return _sample;
      final j = jsonDecode(res.body) as Map<String, dynamic>;
      final cur = j['current'], hourly = j['hourly'], daily = j['daily'];
      final times = (hourly['time'] as List).cast<String>();
      final from = times.indexWhere((t) => t.compareTo((cur['time'] as String).substring(0, 13)) >= 0).clamp(0, times.length - 1);
      double sum = 0;
      int chance = 0;
      for (var i = from; i < from + 3 && i < times.length; i++) {
        sum += (hourly['precipitation'][i] as num).toDouble();
        chance = chance > (hourly['precipitation_probability'][i] ?? 0) ? chance : (hourly['precipitation_probability'][i] ?? 0) as int;
      }
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      final dates = (daily['time'] as List).cast<String>();
      final w = Weather(
        live: true,
        tempC: (cur['temperature_2m'] as num).round(),
        code: cur['weather_code'] as int,
        rainNext3h: double.parse(sum.toStringAsFixed(1)),
        chanceNext3h: chance,
        days: [
          for (var i = 0; i < dates.length; i++)
            DayForecast(i == 0 ? 'Today' : names[DateTime.parse(dates[i]).weekday - 1],
                double.parse((daily['precipitation_sum'][i] as num).toStringAsFixed(1)),
                (daily['precipitation_probability_max'][i] ?? 0) as int, daily['weather_code'][i] as int),
        ],
      );
      _cache = w;
      _at = DateTime.now();
      return w;
    } catch (_) {
      return _sample;
    }
  }
}
