cmake_minimum_required(VERSION 2.8)
include(FindPkgConfig)

project(ANT_STREAM_NATIVE_INTERNAL)

add_definitions(`pkg-config --libs --cflags dbus-1 glib-2.0 dbus-glib-1 gio-2.0 gstreamer-1.0`)

add_library(ant_stream_native SHARED ant_stream_native_internal.c ll.c)
target_link_libraries(ant_stream_native dbus-1 glib-2.0 dbus-glib-1 gstreamer-1.0 gstapp-1.0 gobject-2.0 gmodule-2.0 gio-2.0 pthread)