import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import 'app_version.dart';

const _installChannel = MethodChannel('rg.inventario/update');

class AppUpdateController extends ChangeNotifier {
  AppUpdateController({Dio? http}) : _http = http ?? Dio();

  final Dio _http;
  AppRelease? available;
  double? progress;
  bool busy = false;
  String? error;
  bool permissionNeeded = false;
  int? _skippedCode;

  bool get hasUpdate => available != null;

  void dismiss() {
    if (available?.forceUpdate == true) return;
    _skippedCode = available?.versionCode;
    available = null;
    notifyListeners();
  }

  Future<void> check({required int currentCode}) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final token = Supabase.instance.client.auth.currentSession?.accessToken;
    if (token == null || token.isEmpty) return;
    try {
      final res = await _http.get(
        '${AppConfig.resolvedBodegaApiUrl}/api/app/latest',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      final body = res.data;
      if (body is! Map || body['release'] == null) {
        available = null;
        notifyListeners();
        return;
      }
      final release = AppRelease.fromMap(Map<String, dynamic>.from(body['release'] as Map));
      final newer = isNewerAppRelease(currentCode, release.versionCode);
      final skipped = !release.forceUpdate && _skippedCode == release.versionCode;
      available = newer && !skipped ? release : null;
      error = null;
      notifyListeners();
    } catch (_) {
      // Si no hay red, no bloqueamos la bodega.
    }
  }

  Future<void> apply() async {
    final release = available;
    if (release == null || busy) return;
    busy = true;
    error = null;
    permissionNeeded = false;
    progress = 0;
    notifyListeners();
    try {
      final allowed = await _installChannel.invokeMethod<bool>('canInstall') ?? true;
      if (!allowed) {
        await _installChannel.invokeMethod<void>('requestInstallPermission');
        permissionNeeded = true;
        busy = false;
        progress = null;
        notifyListeners();
        return;
      }

      final dir = await getTemporaryDirectory();
      final folder = Directory('${dir.path}/updates');
      if (!folder.existsSync()) folder.createSync(recursive: true);
      final file = File('${folder.path}/InventarioRG-${release.versionName}.apk');
      await _http.download(
        release.downloadUrl,
        file.path,
        onReceiveProgress: (got, total) {
          if (total > 0) {
            progress = got / total;
            notifyListeners();
          }
        },
      );
      progress = 1;
      notifyListeners();
      await _installChannel.invokeMethod<void>('installApk', {'path': file.path});
    } catch (e) {
      error = 'No se pudo instalar. Revisa la conexión e inténtalo otra vez.';
    } finally {
      busy = false;
      notifyListeners();
    }
  }
}
