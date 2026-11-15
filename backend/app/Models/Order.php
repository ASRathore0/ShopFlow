<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'customer_session_id',
        'user_id',
        'order_number',
        'bill_number',
        'bill_serial_no',
        'type',
        'status',
        'total_amount',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'payment_method',
        'split_cash_amount',
        'split_upi_amount',
        'split_card_amount',
        'payment_details',
        'payment_status',
        'received_amount',
        'change_amount',
        'due_amount',
        'due_date',
        'last_reminder_sent_at',
        'whatsapp_sent',
        'whatsapp_status',
        'soundbox_device_id',
        'soundbox_account_name',
        'utr_number',
        'soundbox_synced_at',
        'customer_name',
        'customer_phone',
        'customer_address',
        'notes',
        'pickup_deadline',
        'collected_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'split_cash_amount' => 'decimal:2',
        'split_upi_amount' => 'decimal:2',
        'split_card_amount' => 'decimal:2',
        'payment_details' => 'array',
        'received_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'due_date' => 'date',
        'last_reminder_sent_at' => 'datetime',
        'whatsapp_sent' => 'boolean',
        'pickup_deadline' => 'datetime',
        'collected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function customerSession()
    {
        return $this->belongsTo(CustomerSession::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reservation()
    {
        return $this->hasOne(Reservation::class);
    }
}
