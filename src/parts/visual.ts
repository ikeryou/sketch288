import { Body } from "matter-js";
import { Func } from '../core/func';
import { Canvas } from '../webgl/canvas';
import { Object3D } from 'three/src/core/Object3D';
import { Update } from '../libs/update';
import { MatterjsMgr } from './matterjsMgr';
import { Mesh } from 'three/src/objects/Mesh';
import { Color } from 'three/src/math/Color';
import { Vector3 } from 'three/src/math/Vector3';
import { CatmullRomCurve3 } from 'three/src/extras/curves/CatmullRomCurve3';
// import { Util } from "../libs/util";
import { ShapeGeometry } from 'three/src/geometries/ShapeGeometry';
import { Shape } from 'three/src/extras/core/Shape';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
import { Scroller } from "../core/scroller";
import { Tween } from "../core/tween";
import { Point } from "../libs/point";
import { Conf } from "../core/conf";
import { Util } from "../libs/util";

export class Visual extends Canvas {

  private _con:Object3D;
  private _matterjs:MatterjsMgr;
  private _lineTop:Mesh;
  // private _lineBottom:Mesh;

  private _txt:Array<{el:HTMLElement, pos:Point}> = [];

  constructor(opt: any) {
    super(opt);

    this._matterjs = new MatterjsMgr();

    this._con = new Object3D();
    this.mainScene.add(this._con);

    const colorA = new Color(0x181A22)

    this._lineTop = new Mesh(
      this._makeGeo(true),
      new MeshBasicMaterial({
        color:colorA,
        transparent:true,
        opacity:1
      })
    )
    this._con.add(this._lineTop);

    // this._lineBottom = new Mesh(
    //   this._makeGeo(false),
    //   new MeshBasicMaterial({
    //     color:colorA,
    //     transparent:true,
    //     wireframe:true,
    //   })
    // )
    // this._con.add(this._lineBottom);

    // テキスト作る
    let y = Func.instance.sh() * 0.25;
    for(let i = 0; i < Conf.instance.TEXT_NUM; i++) {
      const t = document.createElement('div');
      t.innerHTML = (['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][i % 10] as string).toUpperCase();
      // t.innerHTML = 'TITLE <br>text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.text.';
      t.classList.add('item');
      document.querySelector('.l-text')?.append(t);
      this._txt.push({
        el:t,
        pos:new Point(180, y)
      });
      y += Func.instance.sh() * Util.instance.random(0.5, 1);
    }

    Tween.instance.set(document.querySelector('.l-height'), {
      height:y + Func.instance.sh() * 0.5
    })

    Scroller.instance.set(0);
    this._resize()
  }




  // ---------------------------------
  //
  // ---------------------------------
  private _makeGeo(isTop:boolean):ShapeGeometry {

    const arr:Array<Vector3> = []

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    const bodies:Array<Body> = isTop ? this._matterjs.lineTopBodies : this._matterjs.lineBottomBodies;
    if(bodies != undefined) {
      bodies.forEach((val,i) => {
        let x = val.position.x - sw * 0.5
        let y = val.position.y * -1 + sh * 0.5

        if(i == 0) y += sh * 0.1
        if(i == bodies.length - 1) y -= sh * 0.1

        arr.push(new Vector3(x, y, 0));
      })
    }

    if(isTop) {
      arr.push(new Vector3(-sw * 0.5, sh * -0.65, 0));
      arr.push(new Vector3(-sw * 0.5, sh * 0.65, 0));
    } else {
      arr.push(new Vector3(sw * 0.5, sh * -0.65, 0));
      arr.push(new Vector3(sw * 0.5, sh * 0.65, 0));
    }

    const curve = new CatmullRomCurve3(arr, true);
    const points = curve.getPoints(100);

    const shape = new Shape()
    points.forEach((val,i) => {
      if(i == 0) {
        shape.moveTo(val.x, val.y);
      } else {
        shape.lineTo(val.x, val.y)
      }
    });

    return new ShapeGeometry(shape);
  }






  protected _update(): void {
    super._update()

    const sw = Func.instance.sw()
    // const sh = Func.instance.sh()

    const scroll = Scroller.instance.val.y;

    this._txt.forEach((val,i) => {
      const txtSize = this.getRect(val.el);
      let txtX = val.pos.x + sw * 0.1;
      let txtY = val.pos.y - scroll;

      Tween.instance.set(val.el, {
        x:txtX - 150,
        y:txtY - txtSize.height * 0,
      })
      const itemBody = this._matterjs.itemBodies[i];
      if(itemBody != undefined) Body.setPosition(itemBody, {x:txtX, y:txtY})
    })

    this._lineTop.geometry.dispose();
    this._lineTop.geometry = this._makeGeo(true);

    // this._lineBottom.geometry.dispose();
    // this._lineBottom.geometry = this._makeGeo(true);
    // this._lineBottom.visible = false;

    if (this.isNowRenderFrame()) {
      this._render()
    }
  }


  private _render(): void {
    this.renderer.setClearColor(0xEAE8E5, 1)
    this.renderer.render(this.mainScene, this.camera)
  }


  public isNowRenderFrame(): boolean {
    return this.isRender && Update.instance.cnt % 1 == 0
  }


  _resize(isRender: boolean = true): void {
    super._resize();

    const w = Func.instance.sw();
    const h = Func.instance.sh();

    this.renderSize.width = w;
    this.renderSize.height = h;

    this.updateCamera(this.camera, w, h);

    let pixelRatio: number = window.devicePixelRatio || 1;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.clear();

    if (isRender) {
      this._render();
    }
  }
}
