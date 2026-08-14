// NDK 29 libc++ 移除了 char_traits<unsigned char>/<char8_t> 特化
// RN 0.73 folly/fmt 在 C++20 下需要它们。此头文件强制补回。
#include <string>
#include <cstddef>
#include <cstring>

namespace std {

template <>
struct char_traits<unsigned char> : public char_traits<char> {
  using char_type = unsigned char;
  static constexpr void assign(char_type& c1, const char_type& c2) noexcept { c1 = c2; }
  static constexpr bool eq(char_type a, char_type b) noexcept { return a == b; }
  static constexpr bool lt(char_type a, char_type b) noexcept { return a < b; }
  static constexpr size_t length(const char_type* s) {
    size_t n = 0;
    while (s[n] != 0) ++n;
    return n;
  }
  static constexpr const char_type* find(const char_type* s, size_t n, const char_type& a) {
    for (size_t i = 0; i < n; ++i) if (s[i] == a) return s + i;
    return nullptr;
  }
  static char_type* move(char_type* s1, const char_type* s2, size_t n) {
    return static_cast<char_type*>(std::memmove(s1, s2, n));
  }
  static char_type* copy(char_type* s1, const char_type* s2, size_t n) {
    return static_cast<char_type*>(std::memcpy(s1, s2, n));
  }
  static char_type* assign(char_type* s, size_t n, char_type a) {
    for (size_t i = 0; i < n; ++i) s[i] = a;
    return s;
  }
};


} // namespace std
