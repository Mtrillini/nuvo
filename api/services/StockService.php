<?php

class StockService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function decrementar(int $productoId, int $cantidad): void {
        $current = $this->getStock($productoId);
        if ($current === null) {
            throw new RuntimeException("Producto #{$productoId} no encontrado.");
        }
        if ($current < $cantidad) {
            throw new RuntimeException("Stock insuficiente para el producto #{$productoId}. Disponible: {$current}, solicitado: {$cantidad}.");
        }
        $stmt = $this->db->prepare(
            "UPDATE productos SET stock = stock - :cantidad WHERE id = :id AND stock >= :cantidad2"
        );
        $stmt->execute([
            ':cantidad'  => $cantidad,
            ':id'        => $productoId,
            ':cantidad2' => $cantidad,
        ]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException("No se pudo decrementar el stock del producto #{$productoId}. Verificá el stock disponible.");
        }
    }

    public function incrementar(int $productoId, int $cantidad): void {
        $stmt = $this->db->prepare(
            "UPDATE productos SET stock = stock + :cantidad WHERE id = :id"
        );
        $stmt->execute([
            ':cantidad' => $cantidad,
            ':id'       => $productoId,
        ]);
        if ($stmt->rowCount() === 0) {
            throw new RuntimeException("Producto #{$productoId} no encontrado para incrementar stock.");
        }
    }

    public function getStock(int $productoId): ?int {
        $stmt = $this->db->prepare("SELECT stock FROM productos WHERE id = :id");
        $stmt->execute([':id' => $productoId]);
        $row = $stmt->fetch();
        return $row !== false ? (int)$row['stock'] : null;
    }
}
