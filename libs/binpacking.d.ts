declare module "binpacking" {
    
    class Packer {
        constructor(width?: number, height?: number)
        fit(list:any[])
        readonly root:{w:number,h:number}
    }
    class GrowingPacker extends Packer{ }
}