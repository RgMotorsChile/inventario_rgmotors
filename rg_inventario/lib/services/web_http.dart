import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:insforge_flutter/insforge_flutter.dart';

/// Chrome bloquea el header User-Agent. El SDK de InsForge lo manda en cada
/// request y llena la consola. En web lo quitamos antes de salir.
void silenceBrowserForbiddenHeaders() {
  if (!kIsWeb || !Insforge.isInitialized) return;
  final dio = Insforge.instance.http.dio;
  dio.options.headers.remove('User-Agent');
  dio.interceptors.insert(
    0,
    InterceptorsWrapper(
      onRequest: (options, handler) {
        options.headers.remove('User-Agent');
        options.headers.remove('user-agent');
        handler.next(options);
      },
    ),
  );
}
