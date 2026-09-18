# the minimum version of CMake.
cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# react-native codegen-harmony 将 C++ 产物放在 generated/；#include 以 src/main/cpp 为根（如 generated/Foo.h），
# 同时 generated 下的 .cpp 常使用 #include "Foo.h"，故需同时加入 cpp 与 cpp/generated。
set(library_generated_dir "${CMAKE_CURRENT_SOURCE_DIR}/generated")
# 不用 **/*.cpp：OHOS 自带 CMake 在 Windows 上常匹配不到，会得到空列表 → add_library 报 No SOURCES。
file(GLOB_RECURSE library_generated_SRC CONFIGURE_DEPENDS "${library_generated_dir}/*.cpp")
file(GLOB library_SRC CONFIGURE_DEPENDS *.cpp)
# codegen-harmony v2 把产物放在 generated/_oh_rn_<pkg>/ 下，其内部 #include 以该命名空间目录为根
# （如 "RNOH/generated/turbo_modules/X.h"）。必须把 _oh_rn_* 子目录也加入 PUBLIC include，否则
# 消费端（entry rnoh_app 的 PackageProvider.cpp）解析这些头会 fatal error: file not found。
file(GLOB library_codegen_ns_dirs LIST_DIRECTORIES true "${library_generated_dir}/_oh_rn_*")
add_library(modpow SHARED ${library_SRC} ${library_generated_SRC})
target_include_directories(modpow PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${library_generated_dir}
    ${library_codegen_ns_dirs})
target_link_libraries(modpow PUBLIC rnoh)
# 输出到独立目录而非默认的 CMAKE_LIBRARY_OUTPUT_DIRECTORY(obj/arm64-v8a)：hvigor 6.0.1 Windows 上
# syncLibOutputs 同文件判定失效（statSync ino 恒 0），库产物直接写进期望目录时会走同路径 linkFile
# → 先 unlink 删源 → copy 已删源 → ENOENT 00308018。落在别处则走正常跨目录 hard link/copy，绕开 bug
# （lessons: hvigor-windows-same-path-linkfile）。
set_target_properties(modpow PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/hvigor-libs/modpow"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/hvigor-libs/modpow"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/hvigor-libs/modpow")
