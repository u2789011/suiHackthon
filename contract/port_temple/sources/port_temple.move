/// Module: port_temple
module port_temple::port_temple {

    use std::string::String;
    use sui::package::{Self};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::dynamic_object_field as dof;
    use sui::dynamic_field as df;
    use sui::event::emit;

    use suifrens::suifrens::{Self, SuiFren};
    
    // === Errors ===

    /// The amount paid does not match the expected.
    const EAmountIncorrect: u64 = 0;
    /// For when the AccessoriesStore.balance is equal to zero.
    const EportTempleZeroBaslance: u64 = 1;
    /// For the accessories have an accessory type, but the quantity is equal to zero.
    const ENotAvailableQuantity: u64 = 2;
    /// An Application is not authorized to mint.
    const ENotAuthorized: u64 = 3;
    /// Trying to remove an relic that doesn't exist
    const ERelicTypeDoesNotExist: u64 = 4;
    /// Trying to add an relic  that already exists.
    const ERelicTypeAlreadyExist: u64 = 5;

    // === Structs ===

    /// OTW create the `Publisher`
    public struct PORT_TEMPLE has drop {}

    /// This struct represents where the accessory is going to be mounted.
    public struct RelicKey has copy, store, drop { type_: String}

    /// The key for the `MintCap` store.
    public struct MintCapKey has copy, store, drop {}

    /// A capability allowing to mint new relics.
    public struct MintCap has store {}

    /// Temple for any type T. Collects profits from all sold listings
    /// to be later acquirable by the temple Admin.
    public struct PortTemple has key {
        id: UID,
        balance: Balance<SUI>
    }

    /// A capability granting the full control over the `Port Temple`.
    public struct PortTempleOwnerCap has key, store { id: UID }

    /// A Port temple relic, that is being purchased from the `port temple`.
    public struct Relic has key, store {
        id: UID,
        name:String,
        type_: String
    }

    /// A listing an Relic to `Port Temple`. Supply is rither finite or infinite.
    public struct ListedRelics has store {
        id: UID,
        name: String,
        type_: String,
        price: u64,
        quantity: Option<u64>
    }

    // === Events ===
    /// Emmited when new relic is purchased.
    /// off-Chain we only need to know which ID
    /// corresponds to which name to serve the data.
    public struct RelicPurchased has copy, drop {
        id: ID,
        name: String,
        type_: String
    }

    // === init funciton===

    fun init(otw: PORT_TEMPLE, ctx: &mut TxContext) {
        transfer::share_object(
            PortTemple {
                id: object::new(ctx),
                balance: balance::zero()
            }
        );
        transfer::transfer(
            PortTempleOwnerCap { id: object::new(ctx)},
            ctx.sender()
        );
        package::claim_and_keep(otw, ctx)
    }


    // === Main Fuctions ===

    /// Buy an Item from the `AccessoriesStore`. Pay `Coin<SUI>` and
    /// recieve an `Relic`
    public entry fun buy(
        self: &mut PortTemple,
        name: String,
        payment: &mut Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let listing_mut: &mut port_temple::port_temple::ListedRelics = df::borrow_mut<String, ListedRelics>(&mut self.id, name);

        assert!(listing_mut.price <= coin::value(payment), EAmountIncorrect);
        let payment_coin: sui::coin::Coin<sui::sui::SUI> = coin::split(payment, listing_mut.price, ctx);
        coin::put(&mut self.balance, payment_coin);

        // if quantity is set, make sure that it's not 0; then decrement.
        if (option::is_some(&listing_mut.quantity)) {
            let q: &u64 = option::borrow(&listing_mut.quantity);
            assert!(*q > 0, ENotAvailableQuantity);
            option::swap(&mut listing_mut.quantity, *q -1);
        };

        let (name, type_) = (listing_mut.name, listing_mut.type_);
        let relic: Relic = mint(&mut self.id, name, type_, ctx);
        emit(RelicPurchased {
            id: object::id(&relic),
            name,
            type_
        });

        transfer::transfer(relic, ctx.sender())
    }

    /// Mint a new Relic,only for authorized applications.
    public fun mint(
        app: &mut UID,
        name: String,
        type_: String,
        ctx: &mut TxContext
    ): Relic {
        assert!(df::exists_with_type<MintCapKey, MintCap>(app, MintCapKey {}), ENotAuthorized);
        Relic {
            id: object::new(ctx),
            name,
            type_
        }
    }

    /// Add Relic to the SuiFren. Stores the accessory under the `type_` key
    /// making it impossible to wear two acessories of the same type.
    public fun add<T> (sf: &mut SuiFren<T>, relic: Relic) {
        let uid_mut: &mut sui::object::UID = suifrens::uid_mut(sf);
        assert!(!dof::exists_(uid_mut, RelicKey { type_: relic.type_}), ERelicTypeAlreadyExist);
        dof::add(uid_mut, RelicKey { type_: relic.type_ }, relic)
    }

    /// Remove relic from the Suifren. Stores the relic under the 
    /// `type`. Aborts if the accessory is not found.
    public fun remove<T>(sf: &mut SuiFren<T>, type_: String): Relic {
        let uid_mut: &mut sui ::object::UID = suifrens::uid_mut(sf);
        assert!(dof::exists_(uid_mut, RelicKey { type_}), ERelicTypeDoesNotExist);
        dof::remove(uid_mut, RelicKey {type_} )
    }

    // === Admin Functions ===

    /// Withdraw profits from the App as a single Coin
    /// Uses sender of transaction to determine storage and control access.
    public fun collects_profits(
        _: &PortTempleOwnerCap,
        self: &mut PortTemple,
        ctx: &mut TxContext
    ): Coin<SUI> {
        let amount: u64 = balance::value(&self.balance);
        assert!(amount > 0, EportTempleZeroBaslance);
        // Take a transferable `Coin` from a `Balance`
        coin::take(&mut self.balance, amount, ctx)
    }

    /// List an relic in the `Port Temple` to be freely purchasable
    /// within the set quantity (id set)
    public fun add_listing(
        _: &PortTempleOwnerCap,
        self: &mut PortTemple,
        name: String,
        type_: String,
        price: u64,
        quantity: Option<u64>,
        ctx: &mut TxContext
    ) {
        df::add(&mut self.id, name, ListedRelics {
            id: object::new(ctx),
            price,
            quantity,
            name,
            type_
        });
    }

    /// Remove an relic from the `Port Temple`
    public fun remove_listing(
        _: &PortTempleOwnerCap,
        self: &mut PortTemple,
        name: String
    ): Relic {
        df::remove(&mut self.id, name)
    }

    /// Change the quantity value for the listing in the `Port Temple`
    public fun set_quantity(
        _: &PortTempleOwnerCap,
        self: &mut PortTemple,
        name: String,
        quantity: u64
    ) {
        let listing_mut: &mut port_temple::port_temple::ListedRelics = df::borrow_mut<String, ListedRelics>(&mut self.id, name);
        option::swap(&mut listing_mut.quantity, quantity);
    }


    /// Change the price for the listing in the `Port Temple`.
    public fun update_price(
        _: &PortTempleOwnerCap,
        self: &mut PortTemple,
        name: String,
        price: u64
    ) {
        let listing_mut = df::borrow_mut<String, ListedRelics>(&mut self.id, name);
        listing_mut.price = price;
    }

    /// === Listed Relics Fields ===
    
    public fun price(
        self: &PortTemple,
        name: String
    ): u64 {
        let listing = df::borrow<String, ListedRelics>(&self.id, name);
        listing.price
    }

    // === Protected Functions ===

    /// Authorize an app to mint new relics.
    //public entry fun authorize_app
    /*
    public fun authorize_app(_: &PortTempleOwnerCap, app: &mut UID) {
        df::add(app, MintCapKey {}, MintCap {});
    }

    /// Deauthorize an application to mint new accessories.
    public fun deauthorize_app(_: &PortTempleOwnerCap, app: &mut UID) {
        let MintCap {} = df::remove(app, MintCapKey {});
    }
    */

    // === Reads ===
    
    /// Accessor for the `name` field of the `Relic`
    public fun name(relic: &Relic): String {
        relic.name
    }

    public fun type_(relic: &Relic): String {
        relic.type_
    }


}

