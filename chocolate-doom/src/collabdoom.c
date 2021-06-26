#include "collabdoom.h"

#include "d_event.h"
#include "d_ticcmd.h"

#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <stdio.h>
#include <errno.h>
#include <unistd.h>

static event_t event;
static struct sockaddr_in name;
static int state = IS_READY;
static unsigned int namelen;
static ssize_t readlen;
static int fd = -1;

void CollabDOOM_Tic() {

  if (!state) {
    state = IS_RUNNING;
    fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (fd < 0) {
      perror("No se pudo crear el socket\n");
      return;
    }

    name.sin_family = AF_INET;
    name.sin_addr.s_addr = INADDR_ANY;
    name.sin_port = htons(13666);

    if (bind(fd, (struct sockaddr *)&name, sizeof(name)) == -1)
    {
      perror("No se pudo bindear la mandanga\n");
      close(fd);
      fd = -1;
      return;
    }

    namelen = sizeof(name);
    printf("Longitud %d\n", namelen);
    if (getsockname(fd, (struct sockaddr *)&name, &namelen) == -1)
    {
      perror("No se pudo obtener el nombre del socket\n");
      close(fd);
      fd = -1;
      return;
    }

    printf("DGRAM#%d\n", ntohs(name.sin_port));
  }

  if (fd < 0 && state != IS_TERMINATED) {
    state = IS_TERMINATED;
    printf("Cerrando CollabDOOM\n");
    return;
  }

  // Leemos los paquetes del puerto UDP.
  readlen = recv(fd, &event, sizeof(event), MSG_DONTWAIT);
  if (readlen > 0)
  {
    D_PostEvent(&event);
  }
}
