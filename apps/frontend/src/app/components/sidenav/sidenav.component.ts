import { Component, ViewChild } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Drawer } from 'primeng/drawer';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-sidenav',
  imports: [DrawerModule, ButtonModule, AvatarModule, CardModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent {
  @ViewChild('drawerRef') drawerRef!: Drawer;

  closeCallback(e: any): void {
    this.drawerRef.close(e);
  }

  visible = false;

  toggle() {
    this.visible = !this.visible;
  }
}
