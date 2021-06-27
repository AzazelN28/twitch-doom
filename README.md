# Twitch DOOM

## How it works?

I've created a modified version of [chocolate-doom](https://github.com/chocolate-doom/chocolate-doom) without the basic menu options (I've removed them from `chocolate-doom/src/doom/d_menu.c`) and with a UDP socket that can receive new `event_t` and post them with `D_PostEvent`. All this code is located in `chocolate-doom/src/twitchdoom.c` and `chocolate-doom/src/twitchdoom.h`.

```c
//
// DOOM keyboard definition.
// This is the stuff configured by Setup.Exe.
// Most key data are simple ascii (uppercased).
//
#define KEY_RIGHTARROW  0xae
#define KEY_LEFTARROW   0xac
#define KEY_UPARROW     0xad
#define KEY_DOWNARROW   0xaf
#define KEY_ESCAPE      27
#define KEY_ENTER       13
#define KEY_TAB         9
#define KEY_F1          (0x80+0x3b)
#define KEY_F2          (0x80+0x3c)
#define KEY_F3          (0x80+0x3d)
#define KEY_F4          (0x80+0x3e)
#define KEY_F5          (0x80+0x3f)
#define KEY_F6          (0x80+0x40)
#define KEY_F7          (0x80+0x41)
#define KEY_F8          (0x80+0x42)
#define KEY_F9          (0x80+0x43)
#define KEY_F10         (0x80+0x44)
#define KEY_F11         (0x80+0x57)
#define KEY_F12         (0x80+0x58)

#define KEY_BACKSPACE   0x7f
#define KEY_PAUSE       0xff

#define KEY_EQUALS      0x3d
#define KEY_MINUS       0x2d

#define KEY_RSHIFT      (0x80+0x36)
#define KEY_RCTRL       (0x80+0x1d)
#define KEY_RALT        (0x80+0x38)

#define KEY_LALT        KEY_RALT

// new keys:

#define KEY_CAPSLOCK    (0x80+0x3a)
#define KEY_NUMLOCK     (0x80+0x45)
#define KEY_SCRLCK      (0x80+0x46)
#define KEY_PRTSCR      (0x80+0x59)

#define KEY_HOME        (0x80+0x47)
#define KEY_END         (0x80+0x4f)
#define KEY_PGUP        (0x80+0x49)
#define KEY_PGDN        (0x80+0x51)
#define KEY_INS         (0x80+0x52)
#define KEY_DEL         (0x80+0x53)

#define KEYP_0          KEY_INS
#define KEYP_1          KEY_END
#define KEYP_2          KEY_DOWNARROW
#define KEYP_3          KEY_PGDN
#define KEYP_4          KEY_LEFTARROW
#define KEYP_5          (0x80+0x4c)
#define KEYP_6          KEY_RIGHTARROW
#define KEYP_7          KEY_HOME
#define KEYP_8          KEY_UPARROW
#define KEYP_9          KEY_PGUP

#define KEYP_DIVIDE     '/'
#define KEYP_PLUS       '+'
#define KEYP_MINUS      '-'
#define KEYP_MULTIPLY   '*'
#define KEYP_PERIOD     0
#define KEYP_EQUALS     KEY_EQUALS
#define KEYP_ENTER      KEY_ENTER

#define SCANCODE_TO_KEYS_ARRAY {                                            \
    0,   0,   0,   0,   'a',                                  // 0-9 //     \
    'b', 'c', 'd', 'e', 'f',                                                \
    'g', 'h', 'i', 'j', 'k',                                  // 10-19 //   \
    'l', 'm', 'n', 'o', 'p',                                                \
    'q', 'r', 's', 't', 'u',                                  // 20-29 //   \
    'v', 'w', 'x', 'y', 'z',                                                \
    '1', '2', '3', '4', '5',                                  // 30-39 //   \
    '6', '7', '8', '9', '0',                                                \
    KEY_ENTER, KEY_ESCAPE, KEY_BACKSPACE, KEY_TAB, ' ',       // 40-49 //   \
    KEY_MINUS, KEY_EQUALS, '[', ']', '\\',                                  \
    0,   ';', '\'', '`', ',',                                 // 50-59 //   \
    '.', '/', KEY_CAPSLOCK, KEY_F1, KEY_F2,                                 \
    KEY_F3, KEY_F4, KEY_F5, KEY_F6, KEY_F7,                   // 60-69 //   \
    KEY_F8, KEY_F9, KEY_F10, KEY_F11, KEY_F12,                              \
    KEY_PRTSCR, KEY_SCRLCK, KEY_PAUSE, KEY_INS, KEY_HOME,     // 70-79 //   \
    KEY_PGUP, KEY_DEL, KEY_END, KEY_PGDN, KEY_RIGHTARROW,                   \
    KEY_LEFTARROW, KEY_DOWNARROW, KEY_UPARROW,                // 80-89 //   \
    KEY_NUMLOCK, KEYP_DIVIDE,                                               \
    KEYP_MULTIPLY, KEYP_MINUS, KEYP_PLUS, KEYP_ENTER, KEYP_1,               \
    KEYP_2, KEYP_3, KEYP_4, KEYP_5, KEYP_6,                   // 90-99 //   \
    KEYP_7, KEYP_8, KEYP_9, KEYP_0, KEYP_PERIOD,                            \
    0, 0, 0, KEYP_EQUALS,                                     // 100-103 // \
}

// Input event types.
typedef enum
{
    // Key press/release events.
    //    data1: Key code (from doomkeys.h) of the key that was
    //           pressed or released. This is the key as it appears
    //           on a US keyboard layout, and does not change with
    //           layout.
    // For ev_keydown only:
    //    data2: ASCII representation of the key that was pressed that
    //           changes with the keyboard layout; eg. if 'Z' is
    //           pressed on a German keyboard, data1='y',data2='z'.
    //           Not affected by modifier keys.
    //    data3: ASCII input, fully modified according to keyboard
    //           layout and any modifier keys that are held down.
    //           Only set if I_StartTextInput() has been called.
    ev_keydown,
    ev_keyup,

    // Mouse movement event.
    //    data1: Bitfield of buttons currently held down.
    //           (bit 0 = left; bit 1 = right; bit 2 = middle).
    //    data2: X axis mouse movement (turn).
    //    data3: Y axis mouse movement (forward/backward).
    ev_mouse,

    // Joystick state.
    //    data1: Bitfield of buttons currently pressed.
    //    data2: X axis mouse movement (turn).
    //    data3: Y axis mouse movement (forward/backward).
    //    data4: Third axis mouse movement (strafe).
    //    data5: Fourth axis mouse movement (look)
    ev_joystick,

    // Quit event. Triggered when the user clicks the "close" button
    // to terminate the application.
    ev_quit
} evtype_t;
```

Made with :heart: by [AzazelN28](https://github.com/AzazelN28)
